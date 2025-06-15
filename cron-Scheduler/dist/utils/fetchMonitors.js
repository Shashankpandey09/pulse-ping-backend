"use strict";
var __await = (this && this.__await) || function (v) { return this instanceof __await ? (this.v = v, this) : new __await(v); }
var __asyncGenerator = (this && this.__asyncGenerator) || function (thisArg, _arguments, generator) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var g = generator.apply(thisArg, _arguments || []), i, q = [];
    return i = Object.create((typeof AsyncIterator === "function" ? AsyncIterator : Object).prototype), verb("next"), verb("throw"), verb("return", awaitReturn), i[Symbol.asyncIterator] = function () { return this; }, i;
    function awaitReturn(f) { return function (v) { return Promise.resolve(v).then(f, reject); }; }
    function verb(n, f) { if (g[n]) { i[n] = function (v) { return new Promise(function (a, b) { q.push([n, v, a, b]) > 1 || resume(n, v); }); }; if (f) i[n] = f(i[n]); } }
    function resume(n, v) { try { step(g[n](v)); } catch (e) { settle(q[0][3], e); } }
    function step(r) { r.value instanceof __await ? Promise.resolve(r.value.v).then(fulfill, reject) : settle(q[0][2], r); }
    function fulfill(value) { resume("next", value); }
    function reject(value) { resume("throw", value); }
    function settle(f, v) { if (f(v), q.shift(), q.length) resume(q[0][0], q[0][1]); }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchMonitorsByIntervals = fetchMonitorsByIntervals;
const axios_1 = __importDefault(require("axios"));
function fetchMonitorsByIntervals(interval) {
    return __asyncGenerator(this, arguments, function* fetchMonitorsByIntervals_1() {
        //creating a cursor pointer to keep track of last id
        let cursor = null;
        //iterating a infinite while loop to fetch until the all the monitors are fetched
        while (true) {
            const params = {
                interval,
                pageSize: 500,
            };
            if (cursor !== null) {
                params.cursor = cursor;
            }
            const options = {
                //i can't send data directly with get request so passing the data as query params
                // which will be accessible in req.query
                params: params,
                headers: {
                    "x-api-key": process.env.DB_SERVICE_API_KEY,
                },
            };
            try {
                const res = yield __await(axios_1.default.get(`${process.env.EXPRESS_APP_URL}/internal/monitors`, options));
                const { monitors, nextCursor } = res.data;
                if (!monitors || !Array.isArray(monitors) || monitors.length === 0) {
                    console.error("❌ `monitors` is not an array. Response might be malformed Or length of monitor is 0");
                    break;
                }
                console.log(monitors, 'this is first monitor', nextCursor);
                for (const mon of monitors)
                    yield yield __await(JSON.stringify(mon));
                if (!nextCursor) {
                    console.log("✅ No nextCursor. All data fetched.");
                    break;
                }
                cursor = nextCursor;
            }
            catch (error) {
                console.log('catch exec', error);
                break;
            }
        }
    });
}
