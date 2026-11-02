import { PhoneUtils } from '../../src/common/utils/phone.util';

describe('PhoneUtils (Sri Lankan Mobile Validation & Normalization)', () => {
  it('should normalize standard 10-digit 07XXXXXXXX numbers', () => {
    expect(PhoneUtils.normalizeSlPhone('0771234567')).toBe('+94771234567');
    expect(PhoneUtils.normalizeSlPhone('0712345678')).toBe('+94712345678');
    expect(PhoneUtils.normalizeSlPhone('0701234567')).toBe('+94701234567');
  });

  it('should normalize numbers with spaces, dashes, or parentheses', () => {
    expect(PhoneUtils.normalizeSlPhone('077 123 4567')).toBe('+94771234567');
    expect(PhoneUtils.normalizeSlPhone('077-123-4567')).toBe('+94771234567');
    expect(PhoneUtils.normalizeSlPhone('(077) 1234567')).toBe('+94771234567');
  });

  it('should normalize +94, 94, and 0094 prefixed numbers', () => {
    expect(PhoneUtils.normalizeSlPhone('+94771234567')).toBe('+94771234567');
    expect(PhoneUtils.normalizeSlPhone('94771234567')).toBe('+94771234567');
    expect(PhoneUtils.normalizeSlPhone('0094771234567')).toBe('+94771234567');
  });

  it('should normalize 9-digit numbers starting with 7', () => {
    expect(PhoneUtils.normalizeSlPhone('771234567')).toBe('+94771234567');
  });

  it('should reject landlines and non-mobile numbers', () => {
    expect(PhoneUtils.normalizeSlPhone('0112345678')).toBeNull(); // Colombo landline
    expect(PhoneUtils.normalizeSlPhone('0812345678')).toBeNull(); // Kandy landline
    expect(PhoneUtils.normalizeSlPhone('+94112345678')).toBeNull();
  });

  it('should reject invalid lengths and alphanumeric strings', () => {
    expect(PhoneUtils.normalizeSlPhone('077123456')).toBeNull(); // too short
    expect(PhoneUtils.normalizeSlPhone('077123456789')).toBeNull(); // too long
    expect(PhoneUtils.normalizeSlPhone('abc1234567')).toBeNull();
    expect(PhoneUtils.normalizeSlPhone('')).toBeNull();
  });

  it('should mask phone numbers for display', () => {
    expect(PhoneUtils.maskPhone('+94771234567')).toBe('+94771***567');
  });
});
