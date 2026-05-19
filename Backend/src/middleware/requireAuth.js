import User from "../models/User.js";
import jwt from "jsonwebtoken";

export const requireAuth = async (req, res, next) => {
    const { authorization } = req.headers;

    if (!authorization) {
        return res.status(401).json({ message: "Geen token, toegang geweigerd" });
    }

    const token = authorization.split(" ")[1];

    try {
        const { id, role } = jwt.verify(token, process.env.JWT_SECRET);

        if (!id) {
            return res.status(401).json({ message: "Ongeldige token" });
        }

        const user = await User.findById(id).select("_id email role");

        if (!user) {
            return res.status(401).json({ message: "Ongeldige token" });
        }

        req.user = user;
        next();
    } catch (error) {
        if (error.name === "TokenExpiredError") {
            return res.status(401).json({ message: "Token is verlopen" });
        }
        return res.status(401).json({ message: "Ongeldige token" });
    }
};
