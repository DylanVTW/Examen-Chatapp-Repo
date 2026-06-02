import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

function ProfileAvatar() {
  const { user } = useAuth();
  const navigate = useNavigate();

  if (!user) {
    return null;
  }

  const profileImage = user.profileImage;

  const handleProfileClick = () => {
    navigate("/profile");
  };

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "10px",
        cursor: "pointer",
        padding: "5px 10px",
        borderRadius: "4px",
        transition: "background-color 0.2s",
      }}
      onClick={handleProfileClick}
      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--surface-2)")}
      onMouseLeave={(e) =>
        (e.currentTarget.style.backgroundColor = "transparent")
      }
    >
      {profileImage ? (
        <img
          src={profileImage}
          alt="Profiel"
          style={{
            width: "35px",
            height: "35px",
            borderRadius: "50%",
            objectFit: "cover",
          }}
        ></img>
      ) : (
        <div
          style={{
            width: "35px",
            height: "35px",
            borderRadius: "50%",
            backgroundColor: "var(--button-primary)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--button-primary-text)",
            fontWeight: "bold",
            fontSize: "16px",
          }}
        >
          {user.username?.charAt(0).toUpperCase() || "U"}
        </div>
      )}
      <span>{user.username}</span>
    </div>
  );
}

export default ProfileAvatar;
