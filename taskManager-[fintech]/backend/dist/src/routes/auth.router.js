import { Router } from "express";
import { register, login, logout, refresh } from "../controllers/auth.controller.js";
let router = Router();
router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);
router.post('/refresh', refresh);
export default router;
//# sourceMappingURL=auth.router.js.map