"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const crypto_1 = __importDefault(require("crypto"));
const config_js_1 = require("../config.js");
class AuthService {
    static adminTokens = new Set();
    /**
     * Validates the provided PIN against CONFIG.ADMIN_PIN.
     * If valid, issues a temporary admin session token.
     */
    static verifyAdminPin(pin) {
        if (pin === config_js_1.CONFIG.ADMIN_PIN) {
            const token = `adm_${crypto_1.default.randomBytes(16).toString('hex')}`;
            this.adminTokens.add(token);
            return { success: true, token };
        }
        return { success: false, error: 'Invalid Administrator Security PIN.' };
    }
    /**
     * Verifies if an admin token is valid.
     */
    static validateAdminToken(token) {
        if (!token)
            return false;
        return this.adminTokens.has(token);
    }
    /**
     * Generates a unique cryptographically secure session token for a device slot.
     */
    static generateDeviceToken(slotId) {
        return `dev_slot${slotId}_${crypto_1.default.randomBytes(12).toString('hex')}`;
    }
    /**
     * Invalidates an admin token upon logout.
     */
    static invalidateAdminToken(token) {
        this.adminTokens.delete(token);
    }
}
exports.AuthService = AuthService;
