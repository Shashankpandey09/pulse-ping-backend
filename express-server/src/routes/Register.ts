// routes/clerkWebhook.ts
import { Router } from 'express';
import { clerkWebHook } from '../middleware/Webhook_Signature';
import bodyParser from 'body-parser';
import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
const clerkWebhookRouter = Router();

// Configure route-specific middleware chain
clerkWebhookRouter.post(
  '/signup',
  // 1. Raw body parser must come first
  bodyParser.raw({ type: 'application/json' }),
  // 2. Webhook verification middleware
  clerkWebHook,
  // 3. Final request handler
  async(req: Request, res: Response) => {
    try {
      if (!req.clerkPayload) {
        res.status(400).json({ error: 'Missing payload' });
        return;
      }
      const {type}=req.clerkPayload
      switch (type){
        case 'user.created':
        case 'user updated':
         await prisma.user.upsert({
            where:{clerkId:(req.clerkPayload.data["id"])},
            update:{
              email:req.clerkPayload.data.email_addresses[0]?.email_address
            },
            create:{
            clerkId:req.clerkPayload.data["id"],
            email:req.clerkPayload.data.email_addresses[0]?.email_address
            }
          
        })
        break;
         case 'user.deleted':
          await prisma.user.delete({
            where:{clerkId:req.clerkPayload.data.id}
          })
          break;
      }
      
      // Handle payload here
     
      res.status(200).json({ success: true });
    } catch (error) {
      res.status(500).json({ error: `Processing failed ${error} `});
      return;
    }
  }
);

export default clerkWebhookRouter;