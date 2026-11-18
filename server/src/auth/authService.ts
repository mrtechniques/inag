import crypto from 'crypto';
import { CONFIG } from '../config.js';

export class AuthService {
  private static adminTokens = new Set<string>();

  /**
   * Validates the provided PIN against CONFIG.ADMIN_PIN.
   * If valid, issues a temporary admin session token.
   */
  public static verifyAdminPin(pin: string): { success: boolean; token?: string; error?: string } {
    if (pin === CONFIG.ADMIN_PIN) {
      const token = `adm_${crypto.randomBytes(16).toString('hex')}`;
      this.adminTokens.add(token);
      return { success: true, token };
    }
    return { success: false, error: 'Invalid Administrator Security PIN.' };
  }

  /**
   * Verifies if an admin token is valid.
   */
  public static validateAdminToken(token: string | null | undefined): boolean {
    if (!token) return false;
    return this.adminTokens.has(token);
  }

  /**
   * Generates a unique cryptographically secure session token for a device slot.
   */
  public static generateDeviceToken(slotId: number): string {
    return `dev_slot${slotId}_${crypto.randomBytes(12).toString('hex')}`;
  }

  /**
   * Invalidates an admin token upon logout.
   */
  public static invalidateAdminToken(token: string): void {
    this.adminTokens.delete(token);
  }
}
