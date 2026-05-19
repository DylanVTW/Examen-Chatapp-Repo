import express from 'express';
import { requireAuth } from '../middleware/authMiddleware.js';
import { listUsers, startConversation, listConversations } from '../controllers/chatController.js';

const router = express.Router();

router.use(requireAuth);

router.get('/users', listUsers);
router.get('/conversations', listConversations);
router.post('/conversations', startConversation);

export default router;
