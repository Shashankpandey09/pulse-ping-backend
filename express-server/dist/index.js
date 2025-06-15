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
const express_1 = __importDefault(require("express"));
// import { Ngrok } from "./middlewares/ngrok";
const dotenv_1 = __importDefault(require("dotenv"));
const express_2 = require("@clerk/express");
const cors_1 = __importDefault(require("cors"));
const Register_1 = __importDefault(require("./routes/Register"));
const Monitor_1 = __importDefault(require("./routes/Monitor"));
const ws_1 = require("ws");
const redis_1 = require("redis");
const express_3 = require("@clerk/express");
const express_4 = require("@clerk/express");
const apiKey_Auth_1 = require("./middleware/apiKey_Auth");
const internalMonitors_routes_1 = require("./routes/internalMonitors_routes");
const app = (0, express_1.default)();
dotenv_1.default.config();
//creating redisClient
const redisClient = (0, redis_1.createClient)();
const userSocket = new Map();
app.use((0, cors_1.default)({
    origin: "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: [
        "Content-Type",
        "Authorization",
        "ngrok-skip-browser-warning",
    ],
    credentials: false,
}));
// Adding ngrok bypass header HERE (before routes)
// app.use((_req, res, next) => {
//   res.header("ngrok-skip-browser-warning", "true");
//   next();
// });
// 3. Webhook route (no JSON parsing)
app.use("/clerk-webhook", Register_1.default);
app.use(express_1.default.json());
app.use((0, express_2.clerkMiddleware)());
//clerk auth Regular routes
app.use("/monitor", (0, express_4.requireAuth)(), Monitor_1.default);
//internal routes for my scheduler and workers basically my backend services
app.use("/internal", apiKey_Auth_1.apiKeyAuth, internalMonitors_routes_1.internalMonitor_routes);
app.get("/", (req, res) => {
    res.send("hello");
});
function startServer() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            //connecting redisClient
            yield redisClient.connect();
            //creating an http server
            const httpServer = app.listen(process.env.PORT || 3000, () => {
                console.log(`server listening on port ${process.env.PORT}`);
            });
            //upgrading it to the websocket server
            const wss = new ws_1.WebSocketServer({ server: httpServer });
            wss.on("connection", (ws) => {
                ws.on("error", (err) => console.error(err));
                ws.once("message", (data) => __awaiter(this, void 0, void 0, function* () {
                    const parsed_Data = JSON.parse(data.toString());
                    const token = parsed_Data.token;
                    // console.log(token)
                    try {
                        console.log(process.env.CLERK_JWT_KEY);
                        const result = yield (0, express_3.verifyToken)(token, {
                            //@ts-ignore
                            issuer: process.env.CLERK_ISSUER,
                            authorizedParties: [process.env.FRONTEND_API],
                            jwtKey: process.env.CLERK_JWT_KEY,
                            skipJwksCache: true
                        });
                        //@ts-ignore
                        const userID = result === null || result === void 0 ? void 0 : result.sub;
                        console.log('no err', result);
                        ws.userID = userID;
                        const existingSocket = userSocket.get(userID) || [];
                        existingSocket.push(ws);
                        userSocket.set(userID, existingSocket);
                    }
                    catch (error) {
                        console.log('hey');
                        ws.close(4001, `error has occ-${error} `);
                        return;
                    }
                    ws.on("close", () => {
                        const allSockets = userSocket.get(ws.userID) || [];
                        const filtered = allSockets.filter((sock) => sock !== ws);
                        if (filtered.length === 0) {
                            userSocket.delete(ws.userID);
                        }
                        else {
                            userSocket.set(ws.userID, filtered);
                        }
                    });
                }));
            });
            //subscribing my Server to the channel Monitor update
            yield redisClient.subscribe("monitor_update", (message) => {
                //writing socket code for realtime update for a specific user
                const payloadData = JSON.parse(message);
                const data = {
                    type: 'monitor_with_history',
                    payload: payloadData
                };
                //getting sockets from ws object
                const sockets = userSocket.get(payloadData.userId);
                sockets && sockets.forEach((ws) => {
                    if (ws && ws.readyState === ws_1.WebSocket.OPEN) {
                        ws.send(JSON.stringify(data));
                    }
                });
            });
        }
        catch (error) {
            console.log("error occurred", error);
        }
    });
}
startServer();
