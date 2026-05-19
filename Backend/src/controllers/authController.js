import User from '../models/User.js';
import jwt from 'jsonwebtoken' ;

const createAccessToken = (user) => {
    return jwt.sign({ id, role }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '15m' });
};

const createRefreshToken = (user) => {
    return jwt.sign({ id, role }, process.env.REFRESH_TOKEN_SECRET, { expiresIn: '7d' });
};

export const register = async (req, res) => {
    const { username, email, password } = req.body;
    try {
        const exists = await User.findOne({ email });
        if (exists) {
            return res.status(400).json({ message: 'Email al in gebruik' });
        }

        const user = new User({ username, email, password });

        const accessToken = createAccessToken(user);
        const refreshToken = createRefreshToken(user);

        res.cookie("refreshToken", refreshToken, {
            httponly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 dagen
        });

        res.status(201).json({
            id: user._id,
            username: user.username,
            email: user.email,
            accessToken,
            token: accessToken,
            role: user.role,
        });
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
};

export const login = async (req, res) => {
    const { email, password } = req.body;

    try {
        if (!email || !password) {
            return res.status(400).json({ message: "Vul alle velden in" });
        }
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: "Ongeldige inloggegevens" });
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(400).json({ message: "Ongeldige inloggegevens" });
        }
        const accessToken = createAccessToken(user._id, user.role);
        const refreshToken = createRefreshToken(user._id, user.role);

        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: process.env.Node_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });

        res.status(201).json({
            id: user._id,
            username: user.username,
            email: user.email,
            profileImage: user.profileImage,
            accessToken,
            token: accessToken,
            role: user.role,
        })
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
};

export const refresh = async (req, res) => {
    try {
        const refreshToken = req.cookies.refreshToken;
        if (!refreshToken) {
            return res.status(401).json({ message: "Geen token, toegang geweigerd" });
        }

        const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
        const user = await User.findById(decoded.id).select("_id role");

        if (!user) {
            return res.status(401).json({ message: "Ongeldige token" });
        }

        const newAccessToken = createAccessToken(user._id, user.role);
        res.status(200).json({ accessToken: newAccessToken});
        } catch (error) {
        res.status(401).json({ message: "Ongeldige token" });
    }
};

export const logout = async (req, res) => {
    try {
        res.clearCookie("refreshToken", {
            httpOnly: true, 
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
        });
        res.status(200).json({ message: "Uitgelogd" });
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
};

export const uploadProfileImage = async (req, res) => {
    try {
        if (!req.file) {
            console.error("Geen bestand geüpload");
            return res.status(400).json({ message: "Geen bestand geüpload" });
        }
        const userId = req.user._id || req.user._id;
        console.log("File object ontvangen:", req.file);
        const profileImageUrl = req.file.secure_url || req.file.path || req.file.url;

        console.log("Opgeslagen profielafbeelding URL:", userId, "File URL:", profileImageUrl);

        if (!profileImageUrl) {
            console.error("Kon de URL van de geüploade afbeelding niet vinden");
            return res.status(400).json({ message: "Kon de URL van de geüploade afbeelding niet vinden" });
        }

        const user = await User.findByIdAndUpdate(
            userId,
            { profileImage: profileImageUrl },
            { new: true },
        ).select("-password");

        if (!user) {
            return res.status(404).json({ message: "Gebruiker niet gevonden" });
        }

        res.status(200).json({
            message: "Profielfoto geüpload",
            user,
            profileImage: user.profileImage,
        });
    } catch (error) {
        console.error("Upload error:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

export const getProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        const user = await User.findById(userId).select("-password");

        if (!user) {
            return res.status(404).json({ message: "Gebruiker niet gevonden" });
        }

        res.status(200).json({ user });
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
};