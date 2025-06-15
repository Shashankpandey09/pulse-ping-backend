"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.apiKeyAuth = apiKeyAuth;
function apiKeyAuth(req, res, next) {
    const key = req.headers['x-api-key'];
    if (!key || key !== process.env.DB_SERVICE_API_KEY) {
        res.status(401).json({ message: 'Api key invalid or missing' });
        return;
    }
    next();
}
