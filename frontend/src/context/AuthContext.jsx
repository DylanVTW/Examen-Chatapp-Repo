import { createContext, useContext, useMemo, useState } from 'react';

const authContext = createContext();

const ACCESS_TOKEN_KEY = "accesstoken";
const USER_KEY = "user";

export const AuthProvider = ({ children }) => {
    const [accessToken, setAccessToken] = useState(sessionStorage.getItem(ACCESS_TOKEN_KEY),
);

const [user, setUser] = useState(() => {
    const raw = sessionStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;  
});

const [loading] = useState(false);

const login = (token, userData) => {
    setAccessToken(token);
    setUser(userData);
    sessionStorage.setItem(ACCESS_TOKEN_KEY, token);
    sessionStorage.setItem(USER_KEY, JSON.stringify(userData));
};

const logout = () => {
    setAccessToken(null);
    setUser(null);
    sessionStorage.removeItem(ACCESS_TOKEN_KEY);
    sessionStorage.removeItem(USER_KEY);
};

const updateUser = (updatedData) => {
    setUser((current) => {
        const updatedUser = { ...current, ...updatedData };
        sessionStorage.setItem(USER_KEY, JSON.stringify(updatedUser));
        return updatedUser;
  
    });
};

const value = useMemo(() => ({
    accessToken,
    user,
    loading,
    login,
    logout,
    updateUser,
}), 
[accessToken, user, loading]);

return <authContext.Provider value={value}>{children}</authContext.Provider>;

};


export const useAuth = () => {
    const context = useContext(authContext);
    if (!context) {
        throw new Error("useAuth moet gebruikt worden binnen een AuthProvider");
    }
    return context;
};
