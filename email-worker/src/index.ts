import { createClient } from "redis";
import dotenv from 'dotenv'
import { sendEmail } from "./utils/sendEmail";
const emailClient = createClient({
  url: 'redis://my-redis:6379'
});

dotenv.config()
const EmailWorker = async () => {
  try {
    await emailClient.connect();
    console.log('Worker connected to Redis client')
    // iterating for emails indefinitely 
    while (true) {
      const data = await emailClient.brPop("emailQueue", 0);
      const { Url, name, currentState, userEmail } = JSON.parse(data!.element);
      console.log(data)
      if (!Url || !name || !currentState || !userEmail) {
        console.warn("Invalid email payload:", data!.element);
        continue;
      }

      await sendEmail(name, Url, userEmail, currentState)
      console.log(process.env.EMAIL_USER)
      console.log('email sent successfully for monitor', name)
    }

  } catch (error) {
    console.log('error while connecting to redis client', error)
  }

}
EmailWorker()