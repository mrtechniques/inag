"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CONFIG = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
// Load .env if present
dotenv_1.default.config({ path: path_1.default.resolve(process.cwd(), '.env') });
dotenv_1.default.config({ path: path_1.default.resolve(process.cwd(), '../.env') });
exports.CONFIG = {
    PORT: parseInt(process.env.PORT || '4000', 10),
    HOST: process.env.HOST || '0.0.0.0',
    ADMIN_PIN: process.env.ADMIN_PIN || '2025',
    NODE_ENV: process.env.NODE_ENV || 'development',
    ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : ['*'],
    SESSION_SECRET: process.env.SESSION_SECRET || 'yenartifica-cyber-secret-key-2025',
};
