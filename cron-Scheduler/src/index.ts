import { createClient } from "redis";
import dotenv from "dotenv";
import nodeCron from "node-cron";
import { enqueueForInterval } from "./utils/enqueue";
export const schedulerClient = createClient(
  { url: 'redis://my-redis:6379' }
);
dotenv.config();
const StartScheduler = async () => {
  //connecting client
  await schedulerClient.connect()
  console.log('client Connected')
  //scheduling jobs
  nodeCron.schedule("*/5 * * * *", () => {
    enqueueForInterval(5).catch((err: any) => console.log(err));
  });
  nodeCron.schedule("*/10 * * * *", () => {
    enqueueForInterval(10).catch((err: any) => console.log(err));
  });
  nodeCron.schedule("*/30 * * * *", () => {
    enqueueForInterval(30).catch((err: any) => console.log(err));
  });
  console.log("Schedulers Started Working");
};
//if this function is called from the file where it is written then only execute it else if imported and then called don't execute it
if (require.main === module) StartScheduler();
