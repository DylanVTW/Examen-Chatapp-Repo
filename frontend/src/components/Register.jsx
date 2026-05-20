import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function Register() {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const { login } = useAuth();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        if (!username || !email || !password || !confirmPassword) {
            setError('Vul alle velden in');
            setLoading(false);
            return;
        }

        if (password !== confirmPassword) {
            setError('Wachtwoorden komen niet overeen');
            setLoading(false);
            return;
        }

        try {
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: {
                    "Content-Type": "application/json",
                },
                credentials: 'include',
                body: JSON.stringify({ username, email, password }),
            });
            
            const data = await response.json();

            if (!response.ok) {
                const backendErrors = data.errors
                ? Object.values(data.errors).join("")
                : data.message;

                setError(backendErrors || 'Registreren mislukt');
                setLoading(false);
                return; 
            }

            login (data.accessToken, {
                id: data.id,
                username: data.username,
                email: data.email,
                profileImage: data.profileImage || null,
                role: data.role,
            });

            navigate('/chat');
        } catch (error) {
            setError('Server error: ' + error.message);
            setLoading(false);
        }
    };

    return (
    <div style={{ maxWidth: "400px", margin: "50px auto", padding: "20px" }}>
      <h2>Registreren</h2>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: "15px" }}>
          <label htmlFor="username">Username:</label>
          <input
            id="username"
            type="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            style={{ width: "100%", padding: "8px", marginTop: "5px" }}
          />
        </div>
        <div style={{ marginBottom: "15px" }}>
          <label htmlFor="email">Email:</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{ width: "100%", padding: "8px", marginTop: "5px" }}
          />
        </div>

        <div style={{ marginBottom: "15px" }}>
          <label htmlFor="password">Wachtwoord:</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ width: "100%", padding: "8px", marginTop: "5px" }}
          />
        </div>

        <div style={{ marginBottom: "15px" }}>
          <label htmlFor="confirmPassword">Bevestig wachtwoord:</label>
          <input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            style={{ width: "100%", padding: "8px", marginTop: "5px" }}
          />
        </div>

         {error && <p style={{ color: "red", marginBottom: "15px" }}>{error}</p>}

        <button
          type="submit"
          disabled={loading}
          style={{
            width: "100%",
            padding: "10px",
            backgroundColor: loading ? "#ccc" : "#007bff",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: loading ? "not-allowed" : "pointer",
          }}
        >
          {loading ? "Bezig..." : "Registreren"}
        </button>
      </form>

      <p style={{ marginTop: "15px", textAlign: "center" }}>
        Heb je al een account?{" "}
        <Link to="/login" style={{ color: "#007bff", textDecoration: "none" }}>
          Log in
        </Link>
      </p>
    </div>
  );
}

export default Register;
