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
const CheckMonitor_1 = require("./utils/CheckMonitor");
const dotenv_1 = __importDefault(require("dotenv"));
const UpdateMon_createHistory_1 = require("./utils/UpdateMon_createHistory");
const workerClient = (0, redis_1.createClient)();
dotenv_1.default.config();
// have to brpop one by one
//check the url update the db
function Worker() {
    return __awaiter(this, void 0, void 0, function* () {
        //connecting the client
        try {
            yield workerClient.connect();
            console.log("worker connected");
            const listKey = [`monitor-queue:5`, `monitor-queue:10`, `monitor-queue:30`];
            while (true) {
                const result = yield workerClient.brPop(listKey, 0);
                console.log('result', JSON.parse(result.element));
                const monitor = JSON.parse(result.element);
                const prevStatus = monitor.currentStatus;
                const { status, responseTime } = yield (0, CheckMonitor_1.checkUrl)(monitor.url);
                // doing the db status update
                const UpdatedMonitor = yield (0, UpdateMon_createHistory_1.UpdateMonitor_createHistory)(status, responseTime, monitor.id);
                // console.log('updateMonitor',UpdatedMonitor)
                //sending the monitor to the email queue
                console.log('prevStatus-->', prevStatus, 'currentStatus---->', status);
                if (prevStatus !== status) {
                    yield workerClient.lPush("emailQueue", JSON.stringify({
                        Url: UpdatedMonitor === null || UpdatedMonitor === void 0 ? void 0 : UpdatedMonitor.url,
                        name: UpdatedMonitor === null || UpdatedMonitor === void 0 ? void 0 : UpdatedMonitor.name,
                        currentState: UpdatedMonitor === null || UpdatedMonitor === void 0 ? void 0 : UpdatedMonitor.currentStatus,
                        userEmail: UpdatedMonitor === null || UpdatedMonitor === void 0 ? void 0 : UpdatedMonitor.user.email
                    }));
                    console.log('email sent');
                }
                //publishing to the express+websocket service
                if (UpdatedMonitor) {
                    yield workerClient.publish("monitor_update", JSON.stringify(UpdatedMonitor));
                    console.log('reached publisher');
                }
            }
        }
        catch (error) {
            console.log("Error while connecting to the client", error);
        }
    });
}
Worker();
