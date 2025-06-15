import { Router } from "express";
import {  getAuth } from "@clerk/express";
import { prisma } from "../lib/prisma";
import { z } from "zod";
import { checkUrl } from "../utils/checkUrl";

const monitorRoute = Router();


const monitorSchema = z.object({
  name: z.string().min(1),
  url: z.string().url("Enter a valid URL"),
  interval: z.number().min(1),
});

monitorRoute.post("/create", async (req, res) => {
  try {
    const parsed = monitorSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ message: parsed.error.issues });
      return;
    }

    const { userId } = getAuth(req);
    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const { status, responseTime } = await checkUrl(req.body.url);

    const { monitor, history } = await prisma.$transaction(async (c) => {
      const monitorCount = await c.monitor.count({ where: { userId } });
      if (monitorCount >= 5) {
        throw new Error(`Maximum limits reached ${monitorCount}`);
      }
      const monitor = await c.monitor.create({
        data: {
          userId,
          name: req.body.name,
          url: req.body.url,
          interval: req.body.interval,
          currentStatus: status,
        },
      });
      const history = await c.history.create({
        data: {
          monitorId: monitor.id,
          lastStatus: status,
          responseTime,
        },
        include: { monitor: true },
      });
      return { monitor, history };
    });



    res.status(201).json({
      message:
        status === "up"
          ? "Monitor created successfully"
          : "Monitor created but initial check failed",
    });
    return;
  } catch (error) {
    console.error("❌ Error creating monitor:", error);
    res.status(500).json({ message: "Internal server error" });
    return;
  }
});

monitorRoute.get("/", async (req, res) => {
  // fetching clerk id from req
  try {
    const { userId } = getAuth(req);
    if (!userId) {
      res.status(401).json({ message: "unauthorized" });
      return;
    }
    //getting all the monitors for the user
    const monitors = await prisma.monitor.findMany({
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
  } catch (error) {
    res.status(500).json({ error: `error is----> ${error}` });
  }
});

// monitorRoute.get("/history/:id", async (req, res) => {
//   try {
//     // fetching the history for a specific monitor
//     const id: number = Number(req.params.id);
//     const monitorHistory = await prisma.history.findMany({
//       where: { monitorId: id },
//       take:10
//     });
//     if (!monitorHistory) {
//       res.status(404).json({ message: "Not Found" });
//       return;
//     }
//     res.status(200).json({ message: monitorHistory });
//   } catch (error) {
//     res.status(500).json({ message: error });
//   }
// });
monitorRoute.delete("/delete/:id", async (req, res) => {
  try {
    const id: number = Number(req.params.id);
    const [, deletedMonitor] = await prisma.$transaction([
      prisma.history.deleteMany({ where: { monitorId: id } }),
      prisma.monitor.delete({ where: { id: id } }),
    ]);
    res.status(201).json({
      message: `deleted monitor with id ${deletedMonitor.id} and name ${deletedMonitor.name}`,
    });

    return;
  } catch (error) {
    res.status(500).json({ error: error });
    return;
  }
});
export default monitorRoute;
