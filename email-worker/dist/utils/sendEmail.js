"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendEmail = sendEmail;
const nodemailer_1 = __importDefault(require("nodemailer"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
// Configuring Nodemailer transporter 
console.log("EMAIL_USER =", process.env.EMAIL_USER);
console.log("EMAIL_PASS =", process.env.EMAIL_PASS ? "Exists" : "Missing");
const transporter = nodemailer_1.default.createTransport({
    host: "smtp.gmail.com", // Gmail SMTP host 
    port: 587,
    secure: false,
    auth: {
        user: process.env.EMAIL_USER, // Gmail address
        pass: process.env.EMAIL_PASS, // Gmail App Password 
    },
});
console.log(process.env.EMAIL_USER);
function sendEmail(monitorName, url, userEmail, currentStatus) {
    return __awaiter(this, void 0, void 0, function* () {
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: userEmail, // admin or user email
            subject: `Alert: Monitor ${monitorName} is ${currentStatus}`,
            text: `The monitor for URL ${url} is ${currentStatus} as of ${new Date().toLocaleDateString()}`,
        };
        try {
            yield transporter.sendMail(mailOptions);
            console.log(`Alert email sent for monitor ${monitorName}`);
        }
        catch (err) {
            console.error('Error sending alert email:', err);
        }
    });
}
