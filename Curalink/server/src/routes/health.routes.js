import { Router } from 'express';
import axios from 'axios';

const router = Router();

router.get('/', async (req, res) => {
  let ollamaOk = false;
  try {
    await axios.get(`${process.env.OLLAMA_URL}/api/tags`);
    ollamaOk = true;
  } catch (_) {}

  res.json({
    status: 'ok',
    mongo: 'connected',
    ollama: ollamaOk ? 'reachable' : 'unreachable',
    timestamp: new Date().toISOString()
  });
});

export default router;
