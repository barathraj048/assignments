import { z } from "zod";
import { prisma } from "../utils/prisma.js";
import bcrypt from "bcrypt";
import { signinAccessToken, signinRefreshToken, verifyRefreshToken, } from "../utils/jwt.js";
const saltRounds = 10;
const registerSchema = z.object({
    name: z.string().min(3, "Name must be at least 3 characters long"),
    email: z.email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters long"),
});
const loginSchema = z.object({
    email: z.email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters long"),
});
const REFRESH_COOKIE_OPTIONS = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: "/auth",
};
const setRefreshTokenCookie = (res, refreshToken) => {
    res.cookie("refreshToken", refreshToken, REFRESH_COOKIE_OPTIONS);
};
const clearRefreshTokenCookie = (res) => {
    res.clearCookie("refreshToken", { ...REFRESH_COOKIE_OPTIONS, maxAge: 0 });
};
export const register = async (req, res) => {
    const received = registerSchema.safeParse(req.body);
    if (!received.success) {
        res.status(400).json({ error: received.error.flatten().fieldErrors });
        return;
    }
    const { name, email, password } = received.data;
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
        res.status(409).json({ message: "Email already in use" });
        return;
    }
    const hash = await bcrypt.hash(password, saltRounds);
    const user = await prisma.user.create({
        data: { name, email, password: hash },
        select: { id: true, name: true, email: true },
    });
    const accessToken = signinAccessToken({ email: user.email, userId: user.id });
    const refreshToken = signinRefreshToken({ email: user.email, userId: user.id });
    const hashedRefreshToken = await bcrypt.hash(refreshToken, saltRounds);
    await prisma.user.update({
        where: { id: user.id },
        data: { refreshToken: hashedRefreshToken },
    });
    setRefreshTokenCookie(res, refreshToken);
    res.status(201).json({ user, accessToken });
};
export const login = async (req, res) => {
    const received = loginSchema.safeParse(req.body);
    if (!received.success) {
        res.status(400).json({ error: received.error.flatten().fieldErrors });
        return;
    }
    const { email, password } = received.data;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
        res.status(401).json({ message: "Invalid email or password" });
        return;
    }
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
        res.status(401).json({ message: "Invalid email or password" });
        return;
    }
    const accessToken = signinAccessToken({ email: user.email, userId: user.id });
    const refreshToken = signinRefreshToken({ email: user.email, userId: user.id });
    const hashedRefreshToken = await bcrypt.hash(refreshToken, saltRounds);
    await prisma.user.update({
        where: { id: user.id },
        data: { refreshToken: hashedRefreshToken },
    });
    setRefreshTokenCookie(res, refreshToken);
    res.status(200).json({
        user: { id: user.id, name: user.name, email: user.email },
        accessToken,
    });
};
export const refresh = async (req, res) => {
    const token = req.cookies?.refreshToken;
    if (!token) {
        res.status(401).json({ message: "No refresh token found" });
        return;
    }
    let payload;
    try {
        payload = verifyRefreshToken(token);
    }
    catch {
        clearRefreshTokenCookie(res);
        res.status(401).json({ message: "Invalid or expired refresh token" });
        return;
    }
    const user = await prisma.user.findUnique({ where: { id: payload.userId } });
    if (!user || !user.refreshToken) {
        clearRefreshTokenCookie(res);
        res.status(401).json({ message: "Session not found, please login again" });
        return;
    }
    const isValid = await bcrypt.compare(token, user.refreshToken);
    if (!isValid) {
        await prisma.user.update({
            where: { id: payload.userId },
            data: { refreshToken: null },
        });
        clearRefreshTokenCookie(res);
        res.status(401).json({ message: "Token reuse detected, all sessions revoked" });
        return;
    }
    const accessToken = signinAccessToken({ email: user.email, userId: user.id });
    const newRefreshToken = signinRefreshToken({ email: user.email, userId: user.id });
    const hashedRefreshToken = await bcrypt.hash(newRefreshToken, saltRounds);
    await prisma.user.update({
        where: { id: user.id },
        data: { refreshToken: hashedRefreshToken },
    });
    setRefreshTokenCookie(res, newRefreshToken);
    res.status(200).json({ accessToken });
};
export const logout = async (req, res) => {
    const token = req.cookies?.refreshToken;
    if (token) {
        try {
            const payload = verifyRefreshToken(token);
            await prisma.user.update({
                where: { id: payload.userId },
                data: { refreshToken: null },
            });
        }
        catch (error) {
            console.error("Error during logout:", error);
        }
    }
    clearRefreshTokenCookie(res);
    res.json({ message: "Logged out successfully" });
};
//# sourceMappingURL=auth.controller.js.map