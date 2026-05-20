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
  const [error, setError] = useState(null);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef(null);

  const authHeaders = useMemo(() => {
    return {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    };
  }, [accessToken]);

    const loadUsers = async () => {
    const response = await fetch(`${API_BASE}/chat/users`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      credentials: "include",
    });
    if (!response.ok) {
      throw new Error("Kan geen gebruikers laden");
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
      throw new Error("Kan geen gesprekken laden");
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

  useEffect(() => {
    if (!accessToken) {
      return;
    }

    const init = async () => {
      setError(null);
      try {
        await Promise.all([loadUsers(), loadConversations()]);
      } catch (fetchError) {
        setError(fetchError.message);
      }
    };

    init();
  }, [accessToken]);

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
          borderRight: "1px solid #ddd",
          padding: "16px",
          overflowY: "auto",
          backgroundColor: "#f9fbfd",
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
                  backgroundColor: "white",
                  border: "1px solid #d1d5db",
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
                    color: "#111827",
                    fontWeight: 600,
                  }}
                >
                  Mijn profiel
                </button>
              </div>
            ) : null}
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 700, color: "#000" }}>
              {currentUserLabel}{" "}
            </div>
            <small style={{ color: "#000" }}>Logged in</small>
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
            <h2 style={{ margin: 0, color: "#000" }}>Chats</h2>
          </div>
          <button onClick={handleLogout}>Uitloggen</button>
        </div>

        <h3 style={{ marginBottom: "8px", color: "#000" }}>Gesprekken</h3>
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
                  border: isActive ? "1px solid #0969da" : "1px solid #ddd",
                  backgroundColor: isActive ? "#eaf3ff" : "white",
                  color: "#000",
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                }}
              >
                {renderAvatar(other, 34)}
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontWeight: 600, color: "#000" }}>
                    {getUserLabel(other)}
                  </div>
                  <div
                    style={{
                      fontSize: "12px",
                      color: "#000",
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

        <h3 style={{ marginTop: "18px", marginBottom: "8px", color: "#000" }}>
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
                border: "1px solid #ddd",
                backgroundColor: "white",
                color: "#000",
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
            <p style={{ margin: 0, color: "#6b7280", fontSize: "14px" }}>
              Je hebt al met alle gebruikers een gesprek gestart.
            </p>
          ) : null}
        </div>
      </aside>

      <main style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        {activeConversation ? (
          <div style={{ padding: "24px" }}>
            <h2 style={{ marginTop: 0 }}>
              Gesprek met {getUserLabel(getOtherParticipant(activeConversation))}
            </h2>
            <p style={{ marginBottom: "16px", color: "#4b5563" }}>
              Berichten versturen is uitgeschakeld. Je kunt alleen gesprekken
              starten en afsluiten.
            </p>
            <button
              onClick={closeConversation}
              style={{ backgroundColor: "#f3f4f6", color: "#000" }}
            >
              Sluit gesprek af
            </button>
          </div>
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
              color: "#b91c1c",
              borderTop: "1px solid #fecaca",
              backgroundColor: "#fef2f2",
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
