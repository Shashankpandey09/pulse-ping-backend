import axios from "axios";
export const checkUrl=async(URL:string):Promise<{status:string,responseTime:number}>=>{
     const startTime = Date.now();
       let status: "up" | "down" = "down";
       let responseTime = 0;
   
       try {
         const response = await axios.get(URL, { timeout: 5000 });
         responseTime = Date.now() - startTime;
         status = response.status >= 200 && response.status < 300 ? "up" : "down";
       } catch (err) {
         responseTime = Date.now() - startTime;
       }
   
return {status,responseTime};
}