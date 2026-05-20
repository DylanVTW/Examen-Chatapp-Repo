import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import cookieParser from 'cookie-parser';
import authRoutes from './src/routes/authRoutes.js';
import chatRoutes from './src/routes/chatRoutes.js';

const app = express();
const PORT = process.env.PORT || 6000;

const fallbackOrigins = ['http://localhost:5174'];
const envOrigins = [process.env.FRONTEND_URL, process.env.FRONTEND_URL]
.filter(Boolean)
.flatMap((value) => value.split(","))
.map((value) => value.trim())
.filter(Boolean);
const allowedOrigins = new Set([...fallbackOrigins, ...envOrigins]);

app.use(
    cors({
        origin: (origin, callback) => {
            if (!origin || allowedOrigins.has(origin)) {
                return callback(null, origin || true);
            }

            return callback(new Error('Niet toegestaan door CORS')); 
        },
        credentials: true,
    }),
);
app.use(express.json());
app.use(cookieParser());

app.get("/api/health", (req, res) => {
    res.status(200).json({ message: "Server werkend" });
});

app.use('/api/auth', authRoutes);
app.use('/api/chat', chatRoutes);

const startServer = async () => {
    try {
        if (!process.env.MONGO_URI) {
            throw new Error("MONGO_URI is niet ingesteld in .env bestand");
        }
        await mongoose.connect(process.env.MONGO_URI);
        app.listen(PORT, () => {
            console.log(`Server draait op poort ${PORT}`);
        });
    } catch (error) {
        console.error("Fout bij het starten van de server:", error);
        process.exit(1);
    }
};

startServer();