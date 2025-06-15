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
exports.schedulerClient = void 0;
const redis_1 = require("redis");
const dotenv_1 = __importDefault(require("dotenv"));
const node_cron_1 = __importDefault(require("node-cron"));
const enqueue_1 = require("./utils/enqueue");
exports.schedulerClient = (0, redis_1.createClient)();
dotenv_1.default.config();
const StartScheduler = () => __awaiter(void 0, void 0, void 0, function* () {
    //connecting client
    yield exports.schedulerClient.connect();
    console.log('client Connected');
    //scheduling jobs
    node_cron_1.default.schedule("*/5 * * * *", () => {
        (0, enqueue_1.enqueueForInterval)(5).catch((err) => console.log(err));
    });
    node_cron_1.default.schedule("*/10 * * * *", () => {
        (0, enqueue_1.enqueueForInterval)(10).catch((err) => console.log(err));
    });
    node_cron_1.default.schedule("*/30 * * * *", () => {
        (0, enqueue_1.enqueueForInterval)(30).catch((err) => console.log(err));
    });
    console.log("Schedulers Started Working");
});
//if this function is called from the file where it is written then only execute it else if imported and then called don't execute it
if (require.main === module)
    StartScheduler();
