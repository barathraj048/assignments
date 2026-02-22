import { z } from "zod";
import { prisma } from "../utils/prisma.js";
const createTaskSchema = z.object({
    title: z.string().min(1, "Title is required").max(200),
    description: z.string().min(1, "Description is required").max(2000),
    status: z.boolean().optional().default(false),
});
const updateTaskSchema = z.object({
    title: z.string().min(1).max(200).optional(),
    description: z.string().min(1).max(2000).optional(),
    status: z.boolean().optional(),
});
const listQuerySchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(10),
    status: z
        .enum(["true", "false"])
        .optional()
        .transform((v) => (v === undefined ? undefined : v === "true")),
    search: z.string().optional(),
});
export const listTasks = async (req, res) => {
    const parsed = listQuerySchema.safeParse(req.query);
    if (!parsed.success) {
        res.status(400).json({ error: parsed.error.flatten().fieldErrors });
        return;
    }
    const { page, limit, status, search } = parsed.data;
    const userId = req.user.userId;
    const where = {
        userId,
        ...(status !== undefined && { status }),
        ...(search && {
            title: { contains: search, mode: "insensitive" },
        }),
    };
    const [total, tasks] = await Promise.all([
        prisma.task.count({ where }),
        prisma.task.findMany({
            where,
            orderBy: { createdAt: "desc" },
            skip: (page - 1) * limit,
            take: limit,
            select: {
                id: true,
                title: true,
                description: true,
                status: true,
                createdAt: true,
                updatedAt: true,
            },
        }),
    ]);
    res.json({
        data: tasks,
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
            hasNext: page * limit < total,
            hasPrev: page > 1,
        },
    });
};
export const createTask = async (req, res) => {
    const parsed = createTaskSchema.safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json({ error: parsed.error.flatten().fieldErrors });
        return;
    }
    const task = await prisma.task.create({
        data: { ...parsed.data, userId: req.user.userId },
    });
    res.status(201).json(task);
};
export const getTask = async (req, res) => {
    const id = req.params.id;
    const task = await prisma.task.findFirst({
        where: { id, userId: req.user.userId },
    });
    if (!task) {
        res.status(404).json({ error: "Task not found" });
        return;
    }
    res.json(task);
};
export const updateTask = async (req, res) => {
    const id = req.params.id;
    const parsed = updateTaskSchema.safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json({ error: parsed.error.flatten().fieldErrors });
        return;
    }
    const existing = await prisma.task.findFirst({
        where: { id, userId: req.user.userId },
    });
    if (!existing) {
        res.status(404).json({ error: "Task not found" });
        return;
    }
    const data = Object.fromEntries(Object.entries(parsed.data).filter(([, v]) => v !== undefined));
    const task = await prisma.task.update({ where: { id }, data });
    res.json(task);
};
export const deleteTask = async (req, res) => {
    const id = req.params.id;
    const existing = await prisma.task.findFirst({
        where: { id, userId: req.user.userId },
    });
    if (!existing) {
        res.status(404).json({ error: "Task not found" });
        return;
    }
    await prisma.task.delete({ where: { id } });
    res.status(204).send();
};
export const toggleTask = async (req, res) => {
    const id = req.params.id;
    const existing = await prisma.task.findFirst({
        where: { id, userId: req.user.userId },
    });
    if (!existing) {
        res.status(404).json({ error: "Task not found" });
        return;
    }
    const task = await prisma.task.update({
        where: { id },
        data: { status: !existing.status },
    });
    res.json(task);
};
//# sourceMappingURL=task.controller.js.map