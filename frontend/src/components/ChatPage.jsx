import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const API_BASE = "/api";

function ChatPage() {
  const { accessToken, user, logout } = useAuth();
  const navigate = useNavigate();

  const [users, setUsers] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState("");
  const [error, setError] = useState(null);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [editingContent, setEditingContent] = useState("");
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef(null);
  const messagesContainerRef = useRef(null);

  const authHeaders = useMemo(
    () => ({
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    }),
    [accessToken],
  );

  const formatDate = (isoValue) => {
  if (!isoValue) {
    return "";
  }

  return new Date(isoValue).toLocaleString("nl-NL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

  const loadUsers = async () => {
    const response = await fetch(`${API_BASE}/chat/users`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error("Kan gebruikers niet laden");
    }

    const data = await response.json();
    setUsers(data);
  };

  const loadConversations = async () => {
    const response = await fetch(`${API_BASE}/chat/conversations`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error("Kan gesprekken niet laden");
    }

    const data = await response.json();
    setConversations(data);

    if (
      activeConversation &&
      !data.some((conversation) => conversation._id === activeConversation._id)
    ) {
      setActiveConversation(data[0] || null);
      return;
    }

    if (!activeConversation && data.length > 0) {
      setActiveConversation(data[0]);
    }
  };

  const loadMessages = async (conversationId) => {
    setLoadingMessages(true);

    const response = await fetch(
      `${API_BASE}/chat/conversations/${conversationId}/messages`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        credentials: "include",
      },
    );

    if (!response.ok) {
      setLoadingMessages(false);
      throw new Error("Kan berichten niet laden");
    }

    const data = await response.json();
    setMessages(data);
    setLoadingMessages(false);

  };

  const scrollToBottom = (smooth = false) => {
    const el = messagesContainerRef.current;
    if (!el) return;
    try {
      el.scrollTo({ top: el.scrollHeight, behavior: smooth ? "smooth" : "auto" });
    } catch (e) {
      el.scrollTop = el.scrollHeight;
    }
  };

  useEffect(() => {
    if (!accessToken) {
      return;
    }

    const bootstrap = async () => {
      try {
        setError(null);
        await Promise.all([loadUsers(), loadConversations()]);
      } catch (err) {
        setError(err.message);
      }
    };

    bootstrap();
      }, [accessToken]);

  useEffect(() => {
    if (!activeConversation?._id) {
      setMessages([]);
      return;
    }

    const hydrateMessages = async () => {
      try {
        setError(null);
        await loadMessages(activeConversation._id);
      } catch (err) {
        setError(err.message);
      }
    };

    hydrateMessages();
  }, [activeConversation?._id]);

  useEffect(() => {
    if (!messagesContainerRef.current) return;
    // allow DOM to update then scroll
    const id = setTimeout(() => scrollToBottom(true), 50);
    return () => clearTimeout(id);
  }, [messages.length]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        profileMenuRef.current &&
        !profileMenuRef.current.contains(event.target)
      ) {
        setIsProfileMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const sendMessage = async (event) => {
    event.preventDefault();
    if (!activeConversation?._id || !messageText.trim()) {
      return;
    }

    try {
      setError(null);
      const response = await fetch(
        `${API_BASE}/chat/conversations/${activeConversation._id}/messages`,
        {
          method: "POST",
          headers: authHeaders,
          credentials: "include",
          body: JSON.stringify({ content: messageText }),
        },
      );

      if (!response.ok) {
        throw new Error("Bericht versturen mislukt");
      }

      setMessageText("");
      await loadConversations();
      await loadMessages(activeConversation._id);
    } catch (err) {
      setError(err.message);
    }
  };

  const saveEditedMessage = async (messageId) => {
    if (!editingContent.trim() || !activeConversation?._id) {
      return;
    }

    try {
      setError(null);
      const response = await fetch(
        `${API_BASE}/chat/conversations/${activeConversation._id}/messages/${messageId}`,
        {
          method: "PATCH",
          headers: authHeaders,
          credentials: "include",
          body: JSON.stringify({ content: editingContent }),
        },
      );

      if (!response.ok) {
        throw new Error("Bericht bewerken mislukt");
      }

      setEditingMessageId(null);
      setEditingContent("");
      await loadConversations();
      await loadMessages(activeConversation._id);
    } catch (err) {
      setError(err.message);
    }
  };

  const deleteMessage = async (messageId) => {
    if (!activeConversation?._id) {
      return;
    }
    try {
      setError(null);
      const response = await fetch(
        `${API_BASE}/chat/conversations/${activeConversation._id}/messages/${messageId}`,
        {
          method: "DELETE",
          headers: authHeaders,
          credentials: "include",
        },
      );

      if (!response.ok) {
        throw new Error("Bericht verwijderen mislukt");
      }

      await loadConversations();
      await loadMessages(activeConversation._id);
    } catch (error) {
      setError(error.message);
    }
  };


  const getOtherParticipant = (conversation) => {
    return conversation.participants.find(
      (participant) =>
        participant._id !== user?.id && participant._id !== user?._id,
    );
  };

  const getUserLabel = (person) => {
    return person?.username || person?.email || "Onbekende gebruiker";
  };

  const renderAvatar = (person, size = 32) => {
    if (!person) {
      return (
        <div
          style={{
            width: `${size}px`,
            height: `${size}px`,
            borderRadius: "50%",
            backgroundColor: "#d1d5db",
            flexShrink: 0,
          }}
        />
      );
    }

    if (person.profileImage) {
      return (
        <img
          src={person.profileImage}
          alt={getUserLabel(person)}
          style={{
            width: `${size}px`,
            height: `${size}px`,
            borderRadius: "50%",
            objectFit: "cover",
            flexShrink: 0,
          }}
        />
      );
    }

    return (
      <div
        style={{
          width: `${size}px`,
          height: `${size}px`,
          borderRadius: "50%",
          backgroundColor: "#d1d5db",
          color: "#111827",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontWeight: 700,
          fontSize: `${Math.max(12, Math.round(size * 0.4))}px`,
          flexShrink: 0,
        }}
      >
        {getUserLabel(person).charAt(0).toUpperCase()}
      </div>
    );
  };

    const getMessageSenderLabel = (message) => {
    const isOwn =
      message.sender?._id === user?._id || message.sender?._id === user?.id;
    return isOwn ? "Jij" : getUserLabel(message.sender);
  };

  const usersWithoutConversation = useMemo(() => {
    const currentUserId = user?.id || user?._id;
    const currentUserEmail = user?.email;
    const existingDirectPartnerIds = new Set(
      conversations
        .filter((conversation) => conversation.participants?.length === 2)
        .map((conversation) => getOtherParticipant(conversation)?._id)
        .filter(Boolean),
    );

    return users.filter((chatUser) => {
      const isSelfById =
        currentUserId && String(chatUser._id) === String(currentUserId);
      const isSelfByEmail =
        currentUserEmail && chatUser.email === currentUserEmail;
      return (
        !isSelfById &&
        !isSelfByEmail &&
        !existingDirectPartnerIds.has(chatUser._id)
      );
    });
  }, [users, conversations, user]);

  const currentUserLabel = useMemo(() => {
    return getUserLabel(user);
  }, [user]);



  const handleLogout = async () => {
    try {
      await fetch(`${API_BASE}/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
    } finally {
      logout();
      navigate("/login");
    }
  };

  const handleGoToProfile = () => {
    setIsProfileMenuOpen(false);
    navigate("/profile");
  };

  const openOrStartConversation = async (targetUserId) => {
    setError(null);
    try {
      const response = await fetch(`${API_BASE}/chat/conversations`, {
        method: "POST",
        headers: authHeaders,
        credentials: "include",
        body: JSON.stringify({ targetUserId }),
      });

      if (!response.ok) {
        throw new Error("Kan gesprek niet starten");
      }

      const conversation = await response.json();
      setActiveConversation(conversation);
      await loadConversations();
    } catch (fetchError) {
      setError(fetchError.message);
    }
  };

  const closeConversation = async () => {
    if (!activeConversation?._id) {
      return;
    }

    setError(null);

    try {
      const response = await fetch(
        `${API_BASE}/chat/conversations/${activeConversation._id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          credentials: "include",
        },
      );

      if (!response.ok) {
        throw new Error("Kan gesprek niet afsluiten");
      }

      setActiveConversation(null);
      await loadConversations();
    } catch (fetchError) {
      setError(fetchError.message);
    }
  };

  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        fontFamily: "Segoe UI, sans-serif",
      }}
    >
      <aside
        style={{
          width: "320px",
          borderRight: "1px solid var(--border)",
          padding: "16px",
          overflowY: "auto",
          backgroundColor: "var(--surface-1)",
        }}
      >
        <div
          style={{
            marginBottom: "14px",
            display: "flex",
            alignItems: "center",
            gap: "10px",
          }}
        >
          <div
            ref={profileMenuRef}
            style={{ position: "relative", display: "inline-flex" }}
          >
            <button
              type="button"
              onClick={() => setIsProfileMenuOpen((current) => !current)}
              style={{
                border: "none",
                backgroundColor: "transparent",
                padding: 0,
                borderRadius: "999px",
                cursor: "pointer",
                lineHeight: 0,
              }}
              aria-haspopup="menu"
              aria-expanded={isProfileMenuOpen}
              aria-label="Open profielmenu"
            >
              {renderAvatar(user, 40)}
            </button>

            {isProfileMenuOpen ? (
              <div
                style={{
                  position: "absolute",
                  top: "calc(100% + 8px)",
                  left: 0,
                  minWidth: "150px",
                  backgroundColor: "var(--menu-bg)",
                  border: "1px solid var(--border-strong)",
                  borderRadius: "8px",
                  boxShadow: "0 8px 24px rgba(0, 0, 0, 0.12)",
                  zIndex: 20,
                  padding: "6px",
                }}
              >
                <button
                  type="button"
                  onClick={handleGoToProfile}
                  style={{
                    width: "100%",
                    textAlign: "left",
                    border: "none",
                    backgroundColor: "transparent",
                    padding: "8px 10px",
                    borderRadius: "6px",
                    cursor: "pointer",
                    color: "var(--text-h)",
                    fontWeight: 600,
                  }}
                >
                  Mijn profiel
                </button>
              </div>
            ) : null}
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 700, color: "var(--text-h)" }}>
              {currentUserLabel}{" "}
            </div>
            <small style={{ color: "var(--text-h)" }}>Logged in</small>
          </div>
        </div>
        <div
          style={{
            marginBottom: "16px",
            display: "flex",
            justifyContent: "space-between",
          }}
        >
          <div>
            <h2 style={{ margin: 0, color: "var(--text-h)" }}>Chats</h2>
          </div>
          <button onClick={handleLogout}>Uitloggen</button>
        </div>

        <h3 style={{ marginBottom: "8px", color: "var(--text-h)" }}>Gesprekken</h3>
        <div>
          {conversations.map((conversation) => {
            const other = getOtherParticipant(conversation);
            const isActive = activeConversation?._id === conversation._id;
            return (
              <button
                key={conversation._id}
                onClick={() => setActiveConversation(conversation)}
                style={{
                  width: "100%",
                  textAlign: "left",
                  marginBottom: "8px",
                  padding: "10px",
                  borderRadius: "8px",
                  border: isActive ? "1px solid var(--border-primary)" : "1px solid var(--border)",
                  backgroundColor: isActive ? "var(--accent-bg)" : "var(--surface-3)",
                  color: "var(--text-h)",
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                }}
              >
                {renderAvatar(other, 34)}
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontWeight: 600, color: "var(--text-h)" }}>
                    {getUserLabel(other)}
                  </div>
                  <div
                    style={{
                      fontSize: "12px",
                      color: "var(--text)",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {conversation.lastMessage?.content || "Nog geen berichten"}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        <h3 style={{ marginTop: "18px", marginBottom: "8px", color: "var(--text-h)" }}>
          Start nieuw gesprek
        </h3>
        <div>
          {usersWithoutConversation.map((chatUser) => (
            <button
              key={chatUser._id}
              onClick={() => openOrStartConversation(chatUser._id)}
              style={{
                width: "100%",
                textAlign: "left",
                marginBottom: "8px",
                padding: "10px",
                borderRadius: "8px",
                border: "1px solid var(--border)",
                backgroundColor: "var(--surface-3)",
                color: "var(--text-h)",
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                gap: "10px",
              }}
            >
              {getUserLabel(chatUser)}
            </button>
          ))}
          {usersWithoutConversation.length === 0 ? (
            <p style={{ margin: 0, color: "var(--muted)", fontSize: "14px" }}>
              Je hebt al met alle gebruikers een gesprek gestart.
            </p>
          ) : null}
        </div>
      </aside>

      <main style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        {activeConversation ? (
          <>
            <div
              style={{
                borderBottom: "1px solid var(--border)",
                padding: "12px 16px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "12px",
              }}
            >
              <strong>
                Gesprek met{" "}
                {getUserLabel(getOtherParticipant(activeConversation))}
              </strong>
              <button
                onClick={closeConversation}
                style={{ backgroundColor: "var(--surface-3)", color: "var(--text-h)" }}
              >
                Sluit gesprek af
              </button>
            </div>

            <div
              ref={messagesContainerRef}
              style={{
                flex: 1,
                overflowY: "auto",
                padding: "16px",
                backgroundColor: "var(--surface-2)",
              }}
            >
              {loadingMessages ? <p>Berichten laden...</p> : null}
              {!loadingMessages && messages.length === 0 ? (
                <p>Nog geen berichten in dit gesprek.</p>
              ) : null}

              {messages.map((message) => {
                const isOwn =
                  message.sender?._id === user?._id ||
                  message.sender?._id === user?.id;
                const isEditing = editingMessageId === message._id;
                const isReadByOther =
                  activeConversation.participants.length > 1
                    ? message.readBy?.length >= 2
                    : message.readBy?.length > 0;

                return (
                  <div
                    key={message._id}
                    style={{
                      marginBottom: "10px",
                      display: "flex",
                      justifyContent: isOwn ? "flex-end" : "flex-start",
                    }}
                  >
                    <div
                      style={{
                        maxWidth: "70%",
                        padding: "10px",
                        borderRadius: "10px",
                        backgroundColor: isOwn ? "var(--surface-own)" : "var(--surface-3)",
                        border: "1px solid var(--border-strong)",
                        textAlign: isOwn ? "right" : "left",
                      }}
                    >
                      {isEditing ? (
                        <>
                          <textarea
                            value={editingContent}
                            onChange={(event) =>
                              setEditingContent(event.target.value)
                            }
                            rows={3}
                            style={{ width: "100%", marginBottom: "8px" }}
                          />
                          <div style={{ display: "flex", gap: "8px" }}>
                            <button
                              onClick={() => saveEditedMessage(message._id)}
                            >
                              Opslaan
                            </button>
                            <button
                              onClick={() => {
                                setEditingMessageId(null);
                                setEditingContent("");
                              }}
                            >
                              Annuleren
                            </button>
                          </div>
                        </>
                      ) : (
                        <>
                        <div
                            style={{
                              marginBottom: "6px",
                              fontSize: "11px",
                              fontWeight: 700,
                              textTransform: "uppercase",
                              letterSpacing: "0.04em",
                              color: "var(--muted)",
                              display: "flex",
                              justifyContent: isOwn ? "flex-end" : "flex-start",
                            }}
                          >
                            {getMessageSenderLabel(message)}
                          </div>
                          <div style={{ marginBottom: "6px" }}>
                            {message.isDeleted ? (
                              <em style={{ color: "var(--muted)" }}>
                                Dit bericht is verwijderd
                              </em>
                            ) : (
                              <>{message.content}</>
                            )}
                          </div>
                          <div style={{ fontSize: "12px", color: "var(--muted)" }}>
                            Verzonden: {formatDate(message.createdAt)}
                            {message.editedAt
                              ? ` | Bewerkt: ${formatDate(message.editedAt)}`
                              : ""}
                            {isOwn
                              ? ` | ${isReadByOther ? "Gelezen" : "Verzonden"}`
                              : ""}
                          </div>
                          <div
                            style={{
                              marginBottom: "6px",
                              fontSize: "11px",
                              fontWeight: 700,
                              textTransform: "uppercase",
                              letterSpacing: "0.04em",
                              color: "var(--muted)",
                              display: "flex",
                              justifyContent: isOwn ? "flex-end" : "flex-start",
                            }}
                          >
                            {getMessageSenderLabel(message)}
                          </div>
                        </>
                      )}

                      {isOwn && !isEditing && !message.isDeleted ? (
                        <div
                          style={{
                            marginTop: "8px",
                            display: "flex",
                            gap: "8px",
                            justifyContent: "flex-end",
                          }}
                        >
                          <button
                            onClick={() => {
                              setEditingMessageId(message._id);
                              setEditingContent(message.content || "");
                            }}
                          >
                            Bewerken
                          </button>
                          <button onClick={() => deleteMessage(message._id)}>
                            Verwijderen
                          </button>
                        </div>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>

            <form
              onSubmit={sendMessage}
              style={{
                borderTop: "1px solid var(--border)",
                padding: "12px",
                display: "flex",
                gap: "8px",
              }}
            >
              <input
                type="text"
                value={messageText}
                onChange={(event) => setMessageText(event.target.value)}
                placeholder="Typ je bericht..."
                style={{ flex: 1, padding: "10px" }}
              />
              <button type="submit">Verstuur</button>
            </form>
          </>
        ) : (
          <div style={{ padding: "30px" }}>
            <h2>Welkom in je chatapp</h2>
            <p>
              Kies een bestaand gesprek of start een nieuw gesprek vanuit de
              linkerzijde.
            </p>
          </div>
        )}

        {error ? (
          <div
            style={{
              padding: "10px 16px",
              color: "var(--danger-text)",
              borderTop: "1px solid var(--danger-border)",
              backgroundColor: "var(--danger-bg)",
            }}
          >
            {error}
          </div>
        ) : null}
      </main>
    </div>
  );
}

export default ChatPage;
