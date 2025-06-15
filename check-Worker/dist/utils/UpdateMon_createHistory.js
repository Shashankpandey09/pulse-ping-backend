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
exports.UpdateMonitor_createHistory = void 0;
const axios_1 = __importDefault(require("axios"));
const UpdateMonitor_createHistory = (status, responseTime, monitorId) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const resp = yield axios_1.default.post(`${process.env.EXPRESS_APP_URL}/internal/updateMonitorsandHist`, { status, responseTime, monitorId }, {
            headers: {
                'x-api-key': process.env.DB_SERVICE_API_KEY
            },
            timeout: 5000
        });
        return resp.data.monitor;
    }
    catch (error) {
        console.log(error);
        return;
    }
});
exports.UpdateMonitor_createHistory = UpdateMonitor_createHistory;
