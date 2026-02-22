import jwt from "jsonwebtoken";
const ACCESS_SECRET = process.env.ACCESS_TOKEN_SECRET;
const REFRESH_SECRET = process.env.REFRESH_TOKEN_SECRET;
const ACCESS_EXPIRES = process.env.ACCESS_TOKEN_EXPIRES_IN || "15m";
const REFRESH_EXPIRES = process.env.REFRESH_TOKEN_EXPIRES_IN || "7d";
export const signinAccessToken = (payload) => {
    return jwt.sign(payload, ACCESS_SECRET, { expiresIn: ACCESS_EXPIRES });
};
export const signinRefreshToken = (payload) => {
    return jwt.sign(payload, REFRESH_SECRET, { expiresIn: REFRESH_EXPIRES });
};
export function verifyAccessToken(token) {
    return jwt.verify(token, ACCESS_SECRET);
}
export function verifyRefreshToken(token) {
    return jwt.verify(token, REFRESH_SECRET);
}
//# sourceMappingURL=jwt.js.map