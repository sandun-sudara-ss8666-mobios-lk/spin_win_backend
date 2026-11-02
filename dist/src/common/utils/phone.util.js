"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PhoneUtils = void 0;
class PhoneUtils {
    static SL_MOBILE_REGEX = /^\+947[01245678][0-9]{7}$/;
    static normalizeSlPhone(rawPhone) {
        if (!rawPhone || typeof rawPhone !== 'string') {
            return null;
        }
        let cleaned = rawPhone.replace(/[\s\-().]/g, '').trim();
        if (cleaned.startsWith('0094')) {
            cleaned = '+' + cleaned.slice(2);
        }
        else if (cleaned.startsWith('94') && !cleaned.startsWith('+')) {
            cleaned = '+' + cleaned;
        }
        else if (cleaned.startsWith('0')) {
            cleaned = '+94' + cleaned.slice(1);
        }
        else if (cleaned.startsWith('7') && cleaned.length === 9) {
            cleaned = '+94' + cleaned;
        }
        if (!cleaned.startsWith('+94')) {
            return null;
        }
        if (this.SL_MOBILE_REGEX.test(cleaned)) {
            return cleaned;
        }
        return null;
    }
    static isValidSlPhone(phone) {
        return this.normalizeSlPhone(phone) !== null;
    }
    static maskPhone(normalizedPhone) {
        if (!normalizedPhone || normalizedPhone.length < 10) {
            return normalizedPhone;
        }
        const prefix = normalizedPhone.slice(0, 6);
        const suffix = normalizedPhone.slice(-3);
        return `${prefix}***${suffix}`;
    }
}
exports.PhoneUtils = PhoneUtils;
//# sourceMappingURL=phone.util.js.map