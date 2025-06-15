import nodemailer from 'nodemailer'
import dotenv from 'dotenv'
dotenv.config()
// Configuring Nodemailer transporter 
console.log("EMAIL_USER =", process.env.EMAIL_USER);
console.log("EMAIL_PASS =", process.env.EMAIL_PASS ? "Exists" : "Missing");
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",    // Gmail SMTP host 
  port: 587,                 
  secure: false,             
  auth: {
    user: process.env.EMAIL_USER,  // Gmail address
    pass: process.env.EMAIL_PASS,  // Gmail App Password 
  },
});
  console.log(process.env.EMAIL_USER)
  export async function sendEmail(monitorName: string, url: string,userEmail:string,currentStatus:string) {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: userEmail,       // admin or user email
      subject: `Alert: Monitor ${monitorName} is ${currentStatus}`,
      text: `The monitor for URL ${url} is ${currentStatus} as of ${new Date().toLocaleDateString()}`,
    };
    try {
      await transporter.sendMail(mailOptions);
      console.log(`Alert email sent for monitor ${monitorName}`);
     
    } catch (err) {
      console.error('Error sending alert email:', err);
     
    }
  }