import { Request,Response,NextFunction } from "express";

export function apiKeyAuth(req:Request,res:Response,next:NextFunction){
    const key =req.headers['x-api-key']
    if(!key||key!==process.env.DB_SERVICE_API_KEY){
        res.status(401).json({message:'Api key invalid or missing'});
         return
    }

    next()
}