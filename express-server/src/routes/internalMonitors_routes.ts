import { prisma } from "../lib/prisma";
import { Router } from "express";
export const internalMonitor_routes=Router();
internalMonitor_routes.get('/monitors',async(req,res)=>{
    const {cursor,interval,pageSize}=req.query
    const filter:{interval:number,id?:{gt:number}}={interval:Number(interval)}
    if(cursor) filter.id={gt:Number(cursor)}
     try {
        const monitors=await prisma.monitor.findMany({
            where:filter,
            take:Number(pageSize),
            orderBy:{id:'asc'}
        })
        res.status(201).json({monitors:monitors,nextCursor:monitors[monitors.length-1]?.id??null})
        return;
     } catch (error) {
        console.log('error while fetching from db',error)
        res.status(500);
        return
     }
})
internalMonitor_routes.post('/updateMonitorsandHist',async(req,res)=>{
   // {status,responseTime,monitorId}
   const {status,responseTime,monitorId}=req.body;
   try {
      const MONITOR_DATA=await prisma.$transaction(async(c)=>{
      const monitor=await c.monitor.update({
         where:{id:monitorId},
         data:{currentStatus:status},
         include:{user:{select:{email:true}},history:{take:30,orderBy:{lastPing:'desc'}}}
      })
      await c.history.create({
         data:{
            monitorId:monitorId,
            lastStatus:status,
            responseTime:responseTime
         }, 
      })
      return monitor
      })
      res.status(200).json({monitor:MONITOR_DATA})
      return;
   } catch (error) {
      console.log('error while updating monitor and creating history',error);
      res.status(500).json("error while updating monitor and creating history");
      return;
   }

})