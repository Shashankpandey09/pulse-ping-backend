import express from "express";
// import { Ngrok } from "./middlewares/ngrok";
import dotenv from "dotenv";
import { clerkMiddleware } from "@clerk/express";
import cors from "cors";
import clerkWebhookRouter from "./routes/Register";
import monitorRoute from "./routes/Monitor";
import { WebSocketServer, WebSocket, OPEN } from "ws";
import { createClient } from "redis";
import { verifyToken } from "@clerk/express";
import { requireAuth } from "@clerk/express";
import { apiKeyAuth } from "./middleware/apiKey_Auth";
import { internalMonitor_routes } from "./routes/internalMonitors_routes";

const app = express();
dotenv.config();
//creating redisClient
const redisClient = createClient({
  url: 'redis://my-redis:6379'
});
const userSocket = new Map();
interface AuthSocket extends WebSocket {
  userID?: string;
}

app.use(
  cors({
    origin: "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "ngrok-skip-browser-warning",
    ],
    credentials: false,
  })
);

// Adding ngrok bypass header HERE (before routes)
// app.use((_req, res, next) => {
//   res.header("ngrok-skip-browser-warning", "true");
//   next();
// });

// 3. Webhook route (no JSON parsing)
app.use("/clerk-webhook", clerkWebhookRouter);

app.use(express.json());

app.use(clerkMiddleware());

//clerk auth Regular routes
app.use("/monitor", requireAuth(), monitorRoute);
//internal routes for my scheduler and workers basically my backend services
app.use("/internal", apiKeyAuth, internalMonitor_routes);
app.get("/", (req, res) => {
  res.send("hello");
});

async function startServer() {
  try {
    //connecting redisClient
    await redisClient.connect();
    //creating an http server
    const httpServer = app.listen(process.env.PORT || 3000, () => {
      console.log(`server listening on port ${process.env.PORT}`);
    });
    //upgrading it to the websocket server
    const wss = new WebSocketServer({ server: httpServer });

    wss.on("connection", (ws: AuthSocket) => {
      ws.on("error", (err) => console.error(err));
      ws.once("message", async (data) => {
        const parsed_Data = JSON.parse(data.toString());
        const token = parsed_Data.token;
        // console.log(token)
        try {
          console.log(process.env.CLERK_JWT_KEY)
          const PUBLICK_JWT_KEY = process.env.CLERK_JWT_KEY?.replace(/\\n/g, '\n');
          console.log('public key', PUBLICK_JWT_KEY)
          const result = await verifyToken(token, {
            //@ts-ignore
            issuer: process.env.CLERK_ISSUER!,
            authorizedParties: [process.env.FRONTEND_API!],
            jwtKey: PUBLICK_JWT_KEY,
            skipJwksCache: true
          });
          //@ts-ignore
          const userID = result?.sub;
          console.log('no err', result)
          ws.userID = userID;

          const existingSocket = userSocket.get(userID) || [];
          existingSocket.push(ws);
          userSocket.set(userID, existingSocket);
        } catch (error) {
          console.log('hey', error)
          ws.close(4001, `error has occ-${error} `);
          return;
        }



        ws.on("close", () => {
          const allSockets = userSocket.get(ws.userID) || [];

          const filtered = allSockets.filter((sock: AuthSocket) => sock !== ws);

          if (filtered.length === 0) {
            userSocket.delete(ws.userID);
          } else {
            userSocket.set(ws.userID, filtered);
          }
        });
      });
    });
    //subscribing my Server to the channel Monitor update
    await redisClient.subscribe("monitor_update", (message) => {
      //writing socket code for realtime update for a specific user
      const payloadData = JSON.parse(message);
      const data = {
        type: 'monitor_with_history',
        payload: payloadData
      }
      //getting sockets from ws object
      const sockets = userSocket.get(payloadData.userId);

      sockets && sockets.forEach((ws: AuthSocket) => {
        if (ws && ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify(data));
        }
      });
    });
  } catch (error) {
    console.log("error occurred", error);
  }
}

startServer();
