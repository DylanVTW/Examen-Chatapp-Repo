import Conversation from "../models/Conversation.js";
import User from "../models/User.js";

const ensureParticipants = async (conversationId, userId) => {
    return await Conversation.findOne({
        _id: conversationId,
        participants: userId,
    });
};


export const listUsers = async (req, res) => {
    try {
        const users = await User.find({_id: { $ne: req.user.id } }).select('_id username email profileImage').sort({ username: 1 });
        res.status(200).json(users);
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
};

export const startConversation = async (req, res) => {
    try {
        const { targetUserId } = req.body;

        if (!targetUserId) {
            return res.status(400).json({ message: "User Id is verplicht"});
        }

        if(String(targetUserId) === String(req.user.id)) {
            return res.status(400).json({ message: "Je kunt geen gesprek met jezelf starten"});
        }

        const targetUser = await User.findById(targetUserId).select('_id')
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

        const populated = await Conversation.findById(conversation._id).populate('participants', '_id username email profileImage');
        res.status(200).json(populated);
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
};

export const listConversations = async (req, res) => {
    try{
        const conversations = await Conversation.find({
                participants: req.user._id,
        })
        .populate('participants', '_id username email profileImage')
        .sort({ lastMessageAt: -1 });

        const withLastMessage = await Promise.all(conversations.map(async (conversation) =>{
            const lastMessage = await Message.findOne({ conversation: conversation._id }).sort({ createdAt: -1 }).select('content sender createdAt');
            return {
                ...conversation.toObject(),                lastMessage: lastMessage ? {
                    content: lastMessage.content,
                    sender: lastMessage.sender,
                    createdAt: lastMessage.createdAt,
                } : null
            };
        }),
    );
    res.status(200).json(withLastMessage);
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
};

