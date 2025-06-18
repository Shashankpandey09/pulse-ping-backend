import { createClient } from "redis";
import { checkUrl } from "./utils/CheckMonitor";
import dotenv from "dotenv";
import { UpdateMonitor_createHistory } from "./utils/UpdateMon_createHistory";
const workerClient = createClient(
  { url: 'redis://my-redis:6379' }
);
dotenv.config();
// have to brpop one by one
//check the url update the db
async function Worker() {
  //connecting the client
  try {
    await workerClient.connect();
    console.log("worker connected");
    const listKey = [`monitor-queue:5`, `monitor-queue:10`, `monitor-queue:30`];
    while (true) {
      const result = await workerClient.brPop(listKey, 0);
      console.log('result', JSON.parse(result!.element))
      const monitor = JSON.parse(result!.element);
      const prevStatus = monitor.currentStatus;
      const { status, responseTime } = await checkUrl(monitor.url);
      // doing the db status update
      const UpdatedMonitor = await UpdateMonitor_createHistory(
        status,
        responseTime,
        monitor.id
      );
      // console.log('updateMonitor',UpdatedMonitor)
      //sending the monitor to the email queue
      console.log('prevStatus-->', prevStatus, 'currentStatus---->', status)
      if (prevStatus !== status) {
        await workerClient.lPush(
          "emailQueue",
          JSON.stringify({
            Url: UpdatedMonitor?.url,
            name: UpdatedMonitor?.name,
            currentState: UpdatedMonitor?.currentStatus,
            userEmail: UpdatedMonitor?.user.email
          })

        );
        console.log('email sent')
      }
      //publishing to the express+websocket service
      if (UpdatedMonitor) {
        await workerClient.publish(
          "monitor_update",
          JSON.stringify(UpdatedMonitor)
        );
        console.log('reached publisher')
      }
    }
  } catch (error) {
    console.log("Error while connecting to the client", error);
  }
}
Worker();
