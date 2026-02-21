import { Router } from "express";

let router=Router();

router.post('/register')
router.post('/login')
router.post('/logout')
router.post('/refresh')

export default router;