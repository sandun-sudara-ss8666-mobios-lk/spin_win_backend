export class PhoneUtils {
  private static readonly SL_MOBILE_REGEX = /^\+947[01245678][0-9]{7}$/;

  /**
   * Normalizes a Sri Lankan phone string into canonical E.164 format (+947XXXXXXXX).
   * Returns null if invalid.
   */
  static normalizeSlPhone(rawPhone: string): string | null {
    if (!rawPhone || typeof rawPhone !== 'string') {
      return null;
    }

    // Strip whitespaces, dashes, brackets, dots
    let cleaned = rawPhone.replace(/[\s\-().]/g, '').trim();

    // Check international prefix variations
    if (cleaned.startsWith('0094')) {
      cleaned = '+' + cleaned.slice(2);
    } else if (cleaned.startsWith('94') && !cleaned.startsWith('+')) {
      cleaned = '+' + cleaned;
    } else if (cleaned.startsWith('0')) {
      // e.g. 0771234567 -> +94771234567
      cleaned = '+94' + cleaned.slice(1);
    } else if (cleaned.startsWith('7') && cleaned.length === 9) {
      // e.g. 771234567 -> +94771234567
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

  /**
   * Returns whether the given phone is a valid Sri Lankan mobile number.
   */
  static isValidSlPhone(phone: string): boolean {
    return this.normalizeSlPhone(phone) !== null;
  }

  /**
   * Masks a phone number for privacy display (e.g. +94 77 *** *567)
   */
  static maskPhone(normalizedPhone: string): string {
    if (!normalizedPhone || normalizedPhone.length < 10) {
      return normalizedPhone;
    }
    const prefix = normalizedPhone.slice(0, 6);
    const suffix = normalizedPhone.slice(-3);
    return `${prefix}***${suffix}`;
  }
}
