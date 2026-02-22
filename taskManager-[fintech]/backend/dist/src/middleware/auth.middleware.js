import { verifyAccessToken } from "../utils/jwt.js";
export const authenticate = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        res.status(401).json({ error: "Missing or malformed Authorization header" });
        return;
    }
    const token = authHeader.split(" ")[1] || "";
    try {
        const payload = verifyAccessToken(token);
        req.user = payload;
        next();
    }
    catch (error) {
        res.status(401).json({ error: "Invalid or expired access token" });
    }
};
//# sourceMappingURL=auth.middleware.js.map