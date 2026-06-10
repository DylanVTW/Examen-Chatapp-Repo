import { useState } from "react";
import { useAuth } from "../context/AuthContext";

const API_BASE = "/api";

function ProfileImageUpload({ onUploadSuccess }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const { accessToken, updateUser } = useAuth();

  const handleFileChange = (e) => {
    const file = e.target.files[0];

    if (!file) return;

    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowedTypes.includes(file.type)) {
      setError(
        "Ongeldig bestandstype. Alleen JPG, JPEG, PNG, WEBP en GIF zijn toegestaan.",
      );
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setError("Bestand is te groot. Maximaal 2MB.");
      return;
    }
    setSelectedFile(file);
    setError(null);

    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("Form submitted, selectedFile:", selectedFile);

    if (!selectedFile) {
      console.log("No file selected");
      setError("Selecteer een afbeelding om te uploaden.");
      return;
    }
    setUploading(true);
    setError(null);
    setSuccess(false);

    try {
      console.log("Starting upload with accessToken:", accessToken);
      const formData = new FormData();
      formData.append("image", selectedFile);

      console.log("FormData created, sending to backend...");
      const response = await fetch(`${API_BASE}/auth/profile/image`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        credentials: "include",
        body: formData,
      });

      console.log("Response received:", response.status);
      const data = await response.json();
      console.log("Response data:", data);

      if (!response.ok) {
        setError(data.message || data.error || "Fout bij uploaden afbeelding.");
        setUploading(false);
        return;
      }

      setSuccess(true);
      setSelectedFile(null);
      setPreview(null);

      const imageUrl =
        data.profileImage || (data.user && data.user.profileImage);
      console.log("Image URL to save:", imageUrl);

      if (imageUrl) {
        const currentUser = JSON.parse(sessionStorage.getItem("user") || "{}");
        const updatedUser = {
          ...currentUser,
          profileImage: imageUrl,
        };
        sessionStorage.setItem("user", JSON.stringify(updatedUser));
        updateUser({ profileImage: imageUrl });
      }

      setTimeout(() => {
        setSuccess(false);
      }, 3000);

      if (onUploadSuccess) {
        console.log("Calling onUploadSuccess callback");
        onUploadSuccess();
      }
    } catch (error) {
      console.error("Upload error:", error);
      setError("Server error: " + error.message);
      setUploading(false);
    }
  };

  return (
    <div
      style={{
        padding: "20px",
        border: "1px solid var(--border)",
        borderRadius: "8px",
      }}
    >
      <h3>Profielfoto uploaden</h3>

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: "15px" }}>
          <input
            type="file"
            accept="image/jpg,image/jpeg,image/png,image/webp,image/gif"
            onChange={handleFileChange}
            style={{ display: "block", marginBottom: "10px" }}
          />
          {preview && (
            <div style={{ marginTop: "10px" }}>
              <img
                src={preview}
                alt="Preview"
                style={{
                  maxWidth: "150px",
                  maxHeight: "150px",
                  borderRadius: "8px",
                }}
              />
            </div>
          )}
        </div>

        {error && (
          <p style={{ color: "var(--danger-text)", marginBottom: "15px" }}>
            {error}
          </p>
        )}
        {success && (
          <p style={{ color: "var(--button-primary)", marginBottom: "15px" }}>
            Profielfoto succesvol geupload!
          </p>
        )}

        <button
          type="submit"
          disabled={!selectedFile || uploading}
          style={{
            padding: "10px 20px",
            backgroundColor:
              !selectedFile || uploading
                ? "var(--button-disabled)"
                : "var(--button-primary)",
            color: "var(--button-primary-text)",
            border: "none",
            borderRadius: "4px",
            cursor: !selectedFile || uploading ? "not-allowed" : "pointer",
          }}
        >
          {uploading ? "Bezig met uploaden..." : "Uploaden"}
        </button>
      </form>
    </div>
  );
}

export default ProfileImageUpload;
