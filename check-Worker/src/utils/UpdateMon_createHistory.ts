import axios from "axios";
export const UpdateMonitor_createHistory=async(status:string,responseTime:number,monitorId:number)=>{
try {
   const resp=await axios.post(`${process.env.EXPRESS_APP_URL}/internal/updateMonitorsandHist`,{status,responseTime,monitorId},{
    headers:{
        'x-api-key':process.env.DB_SERVICE_API_KEY
    },
    timeout:5000
   }) 
   return resp.data.monitor
} catch (error) {
    console.log(error);
    return
}
}