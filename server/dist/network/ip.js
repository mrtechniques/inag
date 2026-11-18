"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLocalNetworkInfo = getLocalNetworkInfo;
const os_1 = __importDefault(require("os"));
/**
 * Discovers the local LAN IPv4 address.
 * Prioritizes active non-internal Wi-Fi and Ethernet adapters.
 */
function getLocalNetworkInfo() {
    const interfaces = os_1.default.networkInterfaces();
    const candidates = [];
    for (const [name, addrs] of Object.entries(interfaces)) {
        if (!addrs)
            continue;
        for (const addr of addrs) {
            // Look for IPv4 and skip loopback
            if (addr.family === 'IPv4' && !addr.internal) {
                let priority = 1;
                const lowerName = name.toLowerCase();
                // Give higher priority to Wi-Fi, WLAN, Wireless, Ethernet adapters
                if (lowerName.includes('wi-fi') || lowerName.includes('wlan') || lowerName.includes('wireless')) {
                    priority = 10;
                }
                else if (lowerName.includes('ethernet') || lowerName.includes('eth') || lowerName.includes('lan')) {
                    priority = 8;
                }
                else if (lowerName.includes('hotspot')) {
                    priority = 9;
                }
                else if (lowerName.includes('vethernet') || lowerName.includes('virtual') || lowerName.includes('vbox') || lowerName.includes('vmware')) {
                    priority = 0; // Deprioritize virtual adapters
                }
                candidates.push({ name, ip: addr.address, priority });
            }
        }
    }
    // Sort descending by priority
    candidates.sort((a, b) => b.priority - a.priority);
    const primary = candidates[0] || { name: 'localhost', ip: '127.0.0.1', priority: 0 };
    return {
        ipv4: primary.ip,
        interfaceName: primary.name,
        allIps: candidates.map(c => ({ name: c.name, ip: c.ip })),
    };
}
