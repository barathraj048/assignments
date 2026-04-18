import { Router } from 'express';
import * as ctrl from '../controllers/session.controller.js';

const router = Router();

router.post('/',         ctrl.createSession);
router.get('/:id',      ctrl.getSession);
router.patch('/:id',    ctrl.appendMessage);
router.delete('/:id',   ctrl.deleteSession);

export default router;