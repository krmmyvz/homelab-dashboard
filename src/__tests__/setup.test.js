import { describe, it, expect } from 'vitest';

describe('Basic Test Setup', () => {
  it('should pass a basic test', () => {
    expect(1 + 1).toBe(2);
  });

  it('should verify testing environment is working', () => {
    expect(typeof window).toBe('object');
    expect(typeof document).toBe('object');
  });
});
