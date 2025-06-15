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
const redis_1 = require("redis");
const dotenv_1 = __importDefault(require("dotenv"));
const sendEmail_1 = require("./utils/sendEmail");
const emailClient = (0, redis_1.createClient)();
dotenv_1.default.config();
const EmailWorker = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield emailClient.connect();
        console.log('Worker connected to Redis client');
        // iterating for emails indefinitely 
        while (true) {
            const data = yield emailClient.brPop("emailQueue", 0);
            const { Url, name, currentState, userEmail } = JSON.parse(data.element);
            console.log(data);
            if (!Url || !name || !currentState || !userEmail) {
                console.warn("Invalid email payload:", data.element);
                continue;
            }
            yield (0, sendEmail_1.sendEmail)(name, Url, userEmail, currentState);
            console.log(process.env.EMAIL_USER);
            console.log('email sent successfully for monitor', name);
        }
    }
    catch (error) {
        console.log('error while connecting to redis client', error);
    }
});
EmailWorker();
