import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { isCurrentDateByDate } from '../src/dateUtils.js';

describe('isCurrentDateByDate', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-06-15 12:00:00'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('미래 날짜이면 true', () => {
    expect(isCurrentDateByDate('2024-12-31')).toBe(true);
  });

  it('과거 날짜이면 false', () => {
    expect(isCurrentDateByDate('2024-01-01')).toBe(false);
  });

  it('null이면 false', () => {
    expect(isCurrentDateByDate(null)).toBe(false);
  });

  it('빈 문자열이면 false', () => {
    expect(isCurrentDateByDate('')).toBe(false);
  });

  it('길이 1 이하 문자열이면 false', () => {
    expect(isCurrentDateByDate('X')).toBe(false);
  });
});
