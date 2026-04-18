import { Router } from 'express';
import { chat, chatStream } from '../controllers/chat.controller.js';
import { validateRequest } from '../middleware/validateRequest.js';

const router = Router();

router.post('/', validateRequest, chat);
router.post('/stream', validateRequest, chatStream);

export default router;