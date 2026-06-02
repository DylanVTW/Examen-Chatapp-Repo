import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import ProfileImageUpload from './ProfileImageUpload';


function UserProfile() {
    const { user, accessToken} = useAuth();
    const navigate = useNavigate();
    const [profileUser, setProfileUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    useEffect(() => {
        const fetchProfile = async () => {
            if (!accessToken) {
                setError('Geen toegangstoken gevonden. Log alstublieft in.');
                setLoading(false);
                return;
            }

            try {
                const response = await fetch('/api/auth/profile', {
                    method: 'GET',
                    headers: {
                        "Authorization": `Bearer ${accessToken}`,
                    },
                    credentials: 'include',
                });

                const data = await response.json();

                if (!response.ok) {
                    setError(data.message || 'Fout bij het ophalen van profielgegevens');
                    setLoading(false);
                    return;
                }

                setProfileUser(data.user || data);
                setLoading(false);
        } catch (error) {
            setError('Server error: ' + error.message);
            setLoading(false);
        }
    };
    fetchProfile();
}, [accessToken, refreshTrigger]);

if (loading) {
    return <div style={{padding: "20px", color: "#000", backgroundColor: "#fff"}}>Laden...</div>;
}

if (error) {
    return <div style={{padding: "20px", color: "red"}}>{error}</div>;
}

return (
    <div style={{ maxWidth: "600px", margin: "50px auto", padding: "20px", backgroundColor: "#fff", color: "#000" }}>
      <h1 style={{ color: "#000" }}>Mijn Profiel</h1>
      <button
        onClick={() => navigate("/chat")}
        style={{
          padding: "10px 20px",
          backgroundColor: "#007bff",
          color: "#000",
          border: "1px solid #000",
          borderRadius: "4px",
          cursor: "pointer",
          marginBottom: "30px",
        }}
      >
        Terug naar Home
      </button>

      {profileUser && (
        <div
          style={{
            marginBottom: "30px",
            padding: "20px",
            border: "1px solid #000",
            backgroundColor: "#fff",
            color: "#000",
            borderRadius: "8px",
          }}
        >
          <h2 style={{ color: "#000" }}>Profielfoto</h2>
          {profileUser.profileImage ? (
            <img
              src={profileUser.profileImage}
              alt="Profielfoto"
              style={{
                maxWidth: "200px",
                maxHeight: "200px",
                borderRadius: "8px",
                marginBottom: "20px",
                border: "1px solid #000",
                
              }}
            />
          ) : (
            <div
              style={{
                width: "200px",
                height: "200px",
                backgroundColor: "#fff",
                borderRadius: "8px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: "20px",
                border: "1px solid #000",
                color: "#000",
              }}
            >
              Geen profielfoto
            </div>
          )}

          <h2 style={{ color: "#000" }}>Persoonlijke Informatie</h2>
          <p>
            <strong>Gebruikersnaam:</strong> {profileUser.username}
          </p>
          <p>
            <strong>Email:</strong> {profileUser.email}
          </p>
          <p>
            <strong>Rol:</strong>{" "}
            {profileUser.role === "admin" ? "Beheerder" : "Gebruiker"}
          </p>

          <hr style={{ margin: "30px 0" }} />

          <ProfileImageUpload
            onUploadSuccess={() => setRefreshTrigger((prev) => prev + 1)}
          />
        </div>
      )}
    </div>
);
    
}


export default UserProfile;