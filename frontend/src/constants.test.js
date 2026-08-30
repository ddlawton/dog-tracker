import { describe, test, expect } from 'vitest';
import { ACTIVITY_TYPES, ACTIVITY_EMOJI, ACTIVITY_COLORS, POTTY_SUBTYPES } from './constants';

describe('Constants', () => {
  test('ACTIVITY_TYPES contains all expected types', () => {
    expect(ACTIVITY_TYPES).toEqual(['potty', 'vomit', 'eating', 'groom', 'surgery']);
  });

  test('ACTIVITY_EMOJI has emoji for each activity type', () => {
    ACTIVITY_TYPES.forEach(type => {
      expect(ACTIVITY_EMOJI[type]).toBeDefined();
      expect(ACTIVITY_EMOJI[type]).toMatch(/\p{Emoji}/u);
    });
  });

  test('ACTIVITY_COLORS has color for each activity type', () => {
    ACTIVITY_TYPES.forEach(type => {
      expect(ACTIVITY_COLORS[type]).toBeDefined();
      expect(ACTIVITY_COLORS[type]).toMatch(/^#[0-9A-Fa-f]{6}$/);
    });
  });

  test('POTTY_SUBTYPES contains expected subtypes', () => {
    expect(POTTY_SUBTYPES).toContain('pee');
    expect(POTTY_SUBTYPES).toContain('poo');
    expect(POTTY_SUBTYPES).toContain('both');
  });
});
