import Conversation from "../models/Conversation.js";
import User from "../models/User.js";
import Message from "../models/Message.js";

const ensureParticipants = async (conversationId, userId) => {
  return await Conversation.findOne({
    _id: conversationId,
    participants: userId,
  });
};

export const listUsers = async (req, res) => {
  try {
    const users = await User.find({ _id: { $ne: req.user.id } })
      .select("_id username email profileImage")
      .sort({ username: 1 });
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

export const startConversation = async (req, res) => {
  try {
    const { targetUserId } = req.body;

    if (!targetUserId) {
      return res.status(400).json({ message: "User Id is verplicht" });
    }

    if (String(targetUserId) === String(req.user.id)) {
      return res
        .status(400)
        .json({ message: "Je kunt geen gesprek met jezelf starten" });
    }

    const targetUser = await User.findById(targetUserId).select("_id");
    if (!targetUser) {
      return res.status(404).json({ message: "Gebruiker niet gevonden" });
    }

    let conversation = await Conversation.findOne({
      participants: { $all: [req.user.id, targetUserId], $size: 2 },
    });

    if (!conversation) {
      conversation = await Conversation.create({
        participants: [req.user.id, targetUserId],
      });
    }

    const populated = await Conversation.findById(conversation._id).populate(
      "participants",
      "_id username email profileImage",
    );
    res.status(200).json(populated);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

export const listConversations = async (req, res) => {
  try {
    const conversations = await Conversation.find({
      participants: req.user._id,
    })
      .populate("participants", "_id username email profileImage")
      .sort({ lastMessageAt: -1 });

    const withLastMessage = await Promise.all(
      conversations.map(async (conversation) => {
        const lastMessage = await Message.findOne({
          conversation: conversation._id,
        })
          .populate("sender", "_id username email profileImage")
          .sort({ createdAt: -1 });

        return {
          ...conversation.toObject(),
          lastMessage,
        };
      }),
    );
    res.status(200).json(withLastMessage);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

export const deleteConversation = async (req, res) => {
  try {
    const { conversationId } = req.params;

    const conversation = await ensureParticipants(conversationId, req.user.id);
    if (!conversation) {
      return res.status(404).json({ message: "Gesprek niet gevonden" });
    }

    await Conversation.findByIdAndDelete(conversationId);

    res.status(200).json({ message: "Gesprek verwijderd" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

export const getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;

    const conversation = await ensureParticipants(conversationId, req.user.id);
    if (!conversation) {
      return res.status(404).json({ message: "Gesprek niet gevonden" });
    }

    const messages = await Message.find({ conversation: conversationId })
      .populate("sender", "_id username email profileImage")
      .sort({ createdAt: 1 });

    res.status(200).json(messages);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

export const sendMessage = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { content } = req.body;
    const trimmedContent = typeof content === "string" ? content.trim() : "";

    if (!trimmedContent) {
      return res.status(400).json({ message: "Bericht mag niet leeg zijn" });
    }

    const conversation = await ensureParticipants(conversationId, req.user.id);
    if (!conversation) {
      return res.status(404).json({ message: "Gesprek niet gevonden" });
    }

    const message = await Message.create({
      conversation: conversationId,
      sender: req.user._id,
      content: trimmedContent,
    });

    conversation.lastMessageAt = new Date();
    await conversation.save();

    const populated = await Message.findById(message._id).populate(
      "sender",
      "_id username email profileImage",
    );
    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

export const editMessage = async (req, res) => {
  try {
    const { conversationId, messageId } = req.params;
    const { content } = req.body;
    const trimmedContent = typeof content === "string" ? content.trim() : "";

    if (!trimmedContent) {
      return res.status(400).json({ message: "Bericht mag niet leeg zijn" });
    }

    const conversation = await ensureParticipants(conversationId, req.user.id);
    if (!conversation) {
      return res.status(404).json({ message: "Gesprek niet gevonden" });
    }

    const message = await Message.findById(messageId);
    if (!message || String(message.conversation) !== String(conversationId)) {
      return res.status(404).json({ message: "Bericht niet gevonden" });
    }

    if (String(message.sender) !== String(req.user._id)) {
      return res
        .status(403)
        .json({ message: "Je kunt alleen je eigen berichten bewerken" });
    }

    message.content = trimmedContent;
    message.editedAt = new Date();
    await message.save();

    const populated = await Message.findById(message._id).populate(
      "sender",
      "_id username email profileImage",
    );
    res.status(200).json(populated);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

export const deleteMessage = async (req, res) => {
  try {
    const { conversationId, messageId } = req.params;

    const conversation = await ensureParticipants(conversationId, req.user.id);
    if (!conversation) {
      return res.status(404).json({ message: "Gesprek niet gevonden" });
    }

    const message = await Message.findById(messageId);
    if (!message || String(message.conversation) !== String(conversationId)) {
      return res.status(404).json({ message: "Bericht niet gevonden" });
    }

    if (String(message.sender) !== String(req.user._id)) {
      return res
        .status(403)
        .json({ message: "Je kunt alleen je eigen berichten verwijderen" });
    }

    if (message.isDeleted) {
      return res.status(400).json({ message: "Bericht is al verwijderd" });
    }

    message.content = "Bericht verwijderd";
    message.isDeleted = true;
    message.deletedAt = new Date();
    await message.save();

    res.status(200).json(message);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

export const markMessageRead = async (req, res) => {
  try {
    const { conversationId } = req.params;

    const conversation = await ensureParticipants(conversationId, req.user.id);
    if (!conversation) {
      return res.status(404).json({ message: "Gesprek niet gevonden" });
    }

    await Message.updateMany(
      {
        conversation: conversationId,
        sender: { $ne: req.user._id },
        readBy: { $ne: req.user._id },
      },
      {
        $push: { readBy: req.user._id },
      },
    );

    res.status(200).json({ message: "Berichten gemarkeerd als gelezen" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};
