import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import "dotenv/config";
import authRouter from "./routes/auth.router.js";
import taskRouter from "./routes/task.router.js";
const app = express();
app.use(cors({
    origin: process.env.CLIENT_URL || "http://localhost:3001",
    credentials: true,
}));
app.use(express.json());
app.use(cookieParser());
app.use("/auth", authRouter);
app.use("/tasks", taskRouter);
app.get("/health", (_req, res) => res.json({ status: "ok" }));
app.listen(process.env.PORT || 3001, () => {
    console.log(`Server running on port ${process.env.PORT || 3001}`);
});
//# sourceMappingURL=server.js.map