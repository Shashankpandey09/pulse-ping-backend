import { Webhook } from "svix";
import { Request,Response,NextFunction } from "express";


export const clerkWebHook = (req:Request, res:Response, next:NextFunction) => {
  try {
    // Validate headers
    const svixId = req.headers["svix-id"];
    const svixTimestamp = req.headers["svix-timestamp"];
    const svixSignature = req.headers["svix-signature"];
 console.log('bsdk')
    const CLERK_WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;
    if (!CLERK_WEBHOOK_SECRET) {
      res.status(500).json({ error: "Server misconfiguration" });
      return;
    }
 console.log('bsdk1')
    const payload = req.body; // Buffer
    const payloadString = payload.toString("utf8");
    // Validating raw body
    if (!payloadString) {
      res.status(400).json({ error: "Missing raw body" });
      return;
    }
 console.log('bsdk2')
    const webhook = new Webhook(CLERK_WEBHOOK_SECRET);
    const payloads = webhook.verify(payloadString, {
      "svix-id": `${svixId}`,
      "svix-timestamp": `${svixTimestamp}`,
      "svix-signature": `${svixSignature}`,
    }) as Record<string, any>;
 console.log('bsdk')
    // Attach verified payload
    req.clerkPayload = payloads;
    next();
  } catch (error) {
    console.error("Webhook verification failed:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    res.status(401).json({ error: `Invalid signature: ${message}` });
    return
  }
};
