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
exports.internalMonitor_routes = void 0;
const prisma_1 = require("../lib/prisma");
const express_1 = require("express");
exports.internalMonitor_routes = (0, express_1.Router)();
exports.internalMonitor_routes.get('/monitors', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const { cursor, interval, pageSize } = req.query;
    const filter = { interval: Number(interval) };
    if (cursor)
        filter.id = { gt: Number(cursor) };
    try {
        const monitors = yield prisma_1.prisma.monitor.findMany({
            where: filter,
            take: Number(pageSize),
            orderBy: { id: 'asc' }
        });
        res.status(201).json({ monitors: monitors, nextCursor: (_b = (_a = monitors[monitors.length - 1]) === null || _a === void 0 ? void 0 : _a.id) !== null && _b !== void 0 ? _b : null });
        return;
    }
    catch (error) {
        console.log('error while fetching from db', error);
        res.status(500);
        return;
    }
}));
exports.internalMonitor_routes.post('/updateMonitorsandHist', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // {status,responseTime,monitorId}
    const { status, responseTime, monitorId } = req.body;
    try {
        const MONITOR_DATA = yield prisma_1.prisma.$transaction((c) => __awaiter(void 0, void 0, void 0, function* () {
            const monitor = yield c.monitor.update({
                where: { id: monitorId },
                data: { currentStatus: status },
                include: { user: { select: { email: true } }, history: { take: 30, orderBy: { lastPing: 'desc' } } }
            });
            yield c.history.create({
                data: {
                    monitorId: monitorId,
                    lastStatus: status,
                    responseTime: responseTime
                },
            });
            return monitor;
        }));
        res.status(200).json({ monitor: MONITOR_DATA });
        return;
    }
    catch (error) {
        console.log('error while updating monitor and creating history', error);
        res.status(500).json("error while updating monitor and creating history");
        return;
    }
}));
