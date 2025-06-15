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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// routes/clerkWebhook.ts
const express_1 = require("express");
const Webhook_Signature_1 = require("../middleware/Webhook_Signature");
const body_parser_1 = __importDefault(require("body-parser"));
const prisma_1 = require("../lib/prisma");
const clerkWebhookRouter = (0, express_1.Router)();
// Configure route-specific middleware chain
clerkWebhookRouter.post('/signup', 
// 1. Raw body parser must come first
body_parser_1.default.raw({ type: 'application/json' }), 
// 2. Webhook verification middleware
Webhook_Signature_1.clerkWebHook, 
// 3. Final request handler
(req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        if (!req.clerkPayload) {
            res.status(400).json({ error: 'Missing payload' });
            return;
        }
        const { type } = req.clerkPayload;
        switch (type) {
            case 'user.created':
            case 'user updated':
                yield prisma_1.prisma.user.upsert({
                    where: { clerkId: (req.clerkPayload.data["id"]) },
                    update: {
                        email: (_a = req.clerkPayload.data.email_addresses[0]) === null || _a === void 0 ? void 0 : _a.email_address
                    },
                    create: {
                        clerkId: req.clerkPayload.data["id"],
                        email: (_b = req.clerkPayload.data.email_addresses[0]) === null || _b === void 0 ? void 0 : _b.email_address
                    }
                });
                break;
            case 'user.deleted':
                yield prisma_1.prisma.user.delete({
                    where: { clerkId: req.clerkPayload.data.id }
                });
                break;
        }
        // Handle payload here
        res.status(200).json({ success: true });
    }
    catch (error) {
        res.status(500).json({ error: `Processing failed ${error} ` });
        return;
    }
}));
exports.default = clerkWebhookRouter;
