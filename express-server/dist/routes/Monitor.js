"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_2 = require("@clerk/express");
const prisma_1 = require("../lib/prisma");
const zod_1 = require("zod");
const checkUrl_1 = require("../utils/checkUrl");
const monitorRoute = (0, express_1.Router)();
const monitorSchema = zod_1.z.object({
    name: zod_1.z.string().min(1),
    url: zod_1.z.string().url("Enter a valid URL"),
    interval: zod_1.z.number().min(1),
});
monitorRoute.post("/create", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const parsed = monitorSchema.safeParse(req.body);
        if (!parsed.success) {
            res.status(400).json({ message: parsed.error.issues });
            return;
        }
        const { userId } = (0, express_2.getAuth)(req);
        if (!userId) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }
        const { status, responseTime } = yield (0, checkUrl_1.checkUrl)(req.body.url);
        const { monitor, history } = yield prisma_1.prisma.$transaction((c) => __awaiter(void 0, void 0, void 0, function* () {
            const monitorCount = yield c.monitor.count({ where: { userId } });
            if (monitorCount >= 5) {
                throw new Error(`Maximum limits reached ${monitorCount}`);
            }
            const monitor = yield c.monitor.create({
                data: {
                    userId,
                    name: req.body.name,
                    url: req.body.url,
                    interval: req.body.interval,
                    currentStatus: status,
                },
            });
            const history = yield c.history.create({
                data: {
                    monitorId: monitor.id,
                    lastStatus: status,
                    responseTime,
                },
                include: { monitor: true },
            });
            return { monitor, history };
        }));
        res.status(201).json({
            message: status === "up"
                ? "Monitor created successfully"
                : "Monitor created but initial check failed",
        });
        return;
    }
    catch (error) {
        console.error("❌ Error creating monitor:", error);
        res.status(500).json({ message: "Internal server error" });
        return;
    }
}));
monitorRoute.get("/", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // fetching clerk id from req
    try {
        const { userId } = (0, express_2.getAuth)(req);
        if (!userId) {
            res.status(401).json({ message: "unauthorized" });
            return;
        }
        //getting all the monitors for the user
        const monitors = yield prisma_1.prisma.monitor.findMany({
            where: { userId: userId },
            orderBy: { createdAt: "desc" },
            include: {
                history: {
                    take: 10,
                    orderBy: { lastPing: "desc" },
                },
            },
        });
        if (!monitors) {
            res.status(404).json({ message: "not found" });
            return;
        }
        res.status(200).json({ message: monitors });
        return;
    }
    catch (error) {
        res.status(500).json({ error: `error is----> ${error}` });
    }
}));
monitorRoute.get("/history/:id", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // fetching the history for a specific monitor
        const id = Number(req.params.id);
        const monitorHistory = yield prisma_1.prisma.history.findMany({
            where: { monitorId: id },
            take: 10
        });
        if (!monitorHistory) {
            res.status(404).json({ message: "Not Found" });
            return;
        }
        res.status(200).json({ message: monitorHistory });
    }
    catch (error) {
        res.status(500).json({ message: error });
    }
}));
monitorRoute.delete("/delete/:id", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const id = Number(req.params.id);
        const [, deletedMonitor] = yield prisma_1.prisma.$transaction([
            prisma_1.prisma.history.deleteMany({ where: { monitorId: id } }),
            prisma_1.prisma.monitor.delete({ where: { id: id } }),
        ]);
        res.status(201).json({
            message: `deleted monitor with id ${deletedMonitor.id} and name ${deletedMonitor.name}`,
        });
        return;
    }
    catch (error) {
        res.status(500).json({ error: error });
        return;
    }
}));
exports.default = monitorRoute;
