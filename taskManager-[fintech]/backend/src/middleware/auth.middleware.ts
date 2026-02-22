import type { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "../utils/jwt.js";

// Extend Express Request so req.user is available in controllers
declare global {
  namespace Express {
    interface Request {
      user?: { userId: string; email: string };
    }
  }
}

export const authenticate = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ error: "Missing or malformed Authorization header" });
    return;
  }

  const token = authHeader.split(" ")[1] || ""

  try {
    const payload = verifyAccessToken(token);
    req.user = payload;
    next();
  } catch (error) {
    res.status(401).json({ error: "Invalid or expired access token" });
  }
};