import { Router } from "express";

let router = Router();

router.get("/");
router.post("/");
router.get("/:id");
router.patch("/:id");
router.delete("/:id");
router.patch("/:id/toggle");

export default router;