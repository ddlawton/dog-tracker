/**
 * Escape HTML to prevent XSS attacks
 * Escapes: < > & " '
 */
export function escapeHtml(text) {
  if (!text) return '';
  
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Sanitize input by trimming, escaping HTML, and limiting length
 * Returns null for empty/whitespace-only input
 */
export function sanitizeInput(input, maxLength = 5000) {
  if (!input || typeof input !== 'string') return null;
  
  const trimmed = input.trim();
  if (trimmed.length === 0) return null;
  
  const escaped = escapeHtml(trimmed);
  if (escaped.length > maxLength) {
    return escaped.substring(0, maxLength);
  }
  return escaped;
}

/**
 * Validate that a string is safe (no HTML tags, script/SQL injection, excessive length)
 * Returns false for non-strings, null, undefined
 * Returns true for empty strings
 * This is a defense-in-depth check - backend still validates everything
 */
export function isSafeString(str) {
  // Reject non-strings
  if (str === null || str === undefined || typeof str !== 'string') {
    return false;
  }
  
  // Empty string is safe
  if (str.length === 0) return true;
  
  // Check for excessive length
  if (str.length > 10000) return false;
  
  // Check for any HTML tags
  if (/<[^>]*>/i.test(str)) return false;
  
  // Check for dangerous JavaScript patterns
  if (/<script|<iframe|javascript:|onerror=|onload=|eval\(|expression\(/i.test(str)) {
    return false;
  }
  
  // Check for SQL injection patterns (common attack vectors)
  // Look for SQL keywords with suspicious context
  if (/(';\s*(drop|delete|update|insert|alter|exec|execute))|(-{2})|(\bor\s+\d+\s*=\s*\d+)|(\bunion\s+select)/i.test(str)) {
    return false;
  }
  
  return true;
}
