/**
 * Helper to format phone numbers with a space between country code and the digits.
 * e.g., "+919876543210" -> "+91 9876543210"
 *       "9876543210"    -> "+91 9876543210"
 *       "+91 9876543210"-> "+91 9876543210"
 */
export function formatPhoneWithSpace(phone) {
    if (!phone) return '';
    const str = phone.toString().trim();
    const cleanDigits = str.replace(/\D/g, '');
    
    // If it's a 10 digit number
    if (cleanDigits.length === 10) {
        return `+91 ${cleanDigits}`;
    }
    // If it has 12 digits starting with 91
    if (cleanDigits.length === 12 && cleanDigits.startsWith('91')) {
        return `+91 ${cleanDigits.slice(2)}`;
    }
    // If already has + followed by country code without space e.g. +91XXXXXXXXXX
    if (str.startsWith('+91') && !str.startsWith('+91 ')) {
        return `+91 ${str.slice(3).trim()}`;
    }
    return str;
}

export function cleanPhone(phone) {
    if (!phone) return '';
    return phone.toString().replace(/\D/g, '');
}
