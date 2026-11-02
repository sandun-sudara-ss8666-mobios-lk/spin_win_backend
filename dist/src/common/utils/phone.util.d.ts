export declare class PhoneUtils {
    private static readonly SL_MOBILE_REGEX;
    static normalizeSlPhone(rawPhone: string): string | null;
    static isValidSlPhone(phone: string): boolean;
    static maskPhone(normalizedPhone: string): string;
}
