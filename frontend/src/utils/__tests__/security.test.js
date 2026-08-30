import { describe, test, expect } from 'vitest';
import { escapeHtml, sanitizeInput, isSafeString } from '../security';

describe('Security Utilities', () => {
  describe('escapeHtml', () => {
    test('escapes HTML special characters', () => {
      expect(escapeHtml('<script>')).toBe('&lt;script&gt;');
      expect(escapeHtml('alert("xss")')).toBe('alert(&quot;xss&quot;)');
      expect(escapeHtml("it's")).toBe("it&#039;s");
      expect(escapeHtml('a & b')).toBe('a &amp; b');
    });

    test('escapes all special characters in one string', () => {
      const dangerous = '<script>alert("XSS & \'injection\'")</script>';
      const safe = escapeHtml(dangerous);
      
      expect(safe).not.toContain('<');
      expect(safe).not.toContain('>');
      expect(safe).not.toContain('"');
      expect(safe).not.toContain("'");
      expect(safe).toContain('&lt;');
      expect(safe).toContain('&gt;');
      expect(safe).toContain('&quot;');
      expect(safe).toContain('&#039;');
    });

    test('returns empty string for empty input', () => {
      expect(escapeHtml('')).toBe('');
    });

    test('handles normal text without changes', () => {
      const normal = 'Regular potty break at the park';
      expect(escapeHtml(normal)).toBe(normal);
    });
  });

  describe('sanitizeInput', () => {
    test('trims whitespace', () => {
      const result1 = sanitizeInput('  text  ');
      expect(result1).toBe('text');
      const result2 = sanitizeInput('\n\ttext\n\t');
      expect(result2).toBe('text');
    });

    test('escapes HTML in trimmed input', () => {
      const result = sanitizeInput('  <script>alert("xss")</script>  ');
      expect(result).not.toContain('<script>');
      expect(result).toContain('&lt;script&gt;');
    });

    test('returns null for empty/whitespace-only input', () => {
      expect(sanitizeInput('')).toBeNull();
      expect(sanitizeInput('   ')).toBeNull();
      expect(sanitizeInput('\n\t')).toBeNull();
    });

    test('handles normal user input', () => {
      const input = 'Josie had a potty break';
      expect(sanitizeInput(input)).toBe(input);
    });
  });

  describe('isSafeString', () => {
    test('accepts safe strings', () => {
      expect(isSafeString('Normal text')).toBe(true);
      expect(isSafeString('Text with numbers 123')).toBe(true);
      expect(isSafeString('Text with spaces and punctuation.')).toBe(true);
      expect(isSafeString('Émojis 🐕 are okay')).toBe(true);
    });

    test('rejects strings with HTML tags', () => {
      expect(isSafeString('<script>')).toBe(false);
      expect(isSafeString('Text with <b>tags</b>')).toBe(false);
      expect(isSafeString('</div>')).toBe(false);
    });

    test('rejects strings with SQL injection patterns', () => {
      expect(isSafeString("'; DROP TABLE--")).toBe(false);
      expect(isSafeString('1=1--')).toBe(false);
    });

    test('rejects strings with excessive length', () => {
      const longString = 'a'.repeat(10001);
      expect(isSafeString(longString)).toBe(false);
    });

    test('accepts strings at max length', () => {
      const maxString = 'a'.repeat(10000);
      expect(isSafeString(maxString)).toBe(true);
    });

    test('returns false for non-strings', () => {
      expect(isSafeString(null)).toBe(false);
      expect(isSafeString(undefined)).toBe(false);
      expect(isSafeString(123)).toBe(false);
      expect(isSafeString({})).toBe(false);
    });
  });
});
