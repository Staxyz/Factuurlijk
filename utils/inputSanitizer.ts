/**
 * Input sanitization utilities to prevent XSS attacks
 */

/**
 * Sanitizes a string by escaping HTML special characters
 * This prevents XSS attacks when rendering user input
 */
export const sanitizeInput = (input: string | null | undefined): string => {
  if (!input) return '';
  
  const map: { [key: string]: string } = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
  };
  
  return input.replace(/[&<>"'/]/g, (char) => map[char]);
};

/**
 * Validates email format
 */
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validates that a string doesn't contain dangerous patterns
 */
export const isSafeString = (input: string): boolean => {
  // Check for script tags and javascript: protocol
  const dangerousPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+\s*=/i, // onclick, onerror, etc.
    /<iframe/i,
    /<object/i,
    /<embed/i,
  ];
  
  return !dangerousPatterns.some(pattern => pattern.test(input));
};

/**
 * Sanitizes and validates user input
 */
export const sanitizeAndValidate = (input: string, maxLength?: number): string => {
  if (!input) return '';
  
  // Trim whitespace
  let sanitized = input.trim();
  
  // Check length
  if (maxLength && sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }
  
  // Check for dangerous patterns
  if (!isSafeString(sanitized)) {
    throw new Error('Input bevat onveilige karakters');
  }
  
  return sanitized;
};

/**
 * Validates numeric input
 */
export const validateNumber = (value: string | number, min?: number, max?: number): boolean => {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  
  if (isNaN(num)) return false;
  if (min !== undefined && num < min) return false;
  if (max !== undefined && num > max) return false;
  
  return true;
};




