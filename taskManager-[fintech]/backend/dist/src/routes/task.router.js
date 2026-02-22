import { Router } from "express";
import { listTasks, createTask, getTask, updateTask, deleteTask, toggleTask, } from "../controllers/task.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";
const router = Router();
router.use(authenticate); // all task routes require a valid access token
router.get("/", listTasks);
router.post("/", createTask);
router.get("/:id", getTask);
router.patch("/:id", updateTask);
router.delete("/:id", deleteTask);
router.patch("/:id/toggle", toggleTask);
export default router;
//# sourceMappingURL=task.router.js.map