import express from 'express';
import { requireAuth } from '../middleware/requireAuth.js';
import { listUsers, startConversation, listConversations, deleteConversation } from '../controllers/chatController.js';

const router = express.Router();

router.use(requireAuth);

router.get('/users', listUsers);
router.get('/conversations', listConversations);
router.post('/conversations', startConversation);
router.delete('/conversations/:conversationId', deleteConversation);

export default router;
