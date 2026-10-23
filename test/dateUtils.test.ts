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

// LMS 날짜는 KST 기준이므로 실행 환경 TZ와 무관하게 같은 결과여야 함 (#5)
describe('isCurrentDateByDate KST 해석', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('KST 마감 30분 후이면 false', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-26T00:30:00Z')); // KST 09:30
    expect(isCurrentDateByDate('2026-10-26 09:00')).toBe(false);
  });

  it('KST 마감 30분 전이면 true', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-25T23:30:00Z')); // KST 08:30
    expect(isCurrentDateByDate('2026-10-26 09:00')).toBe(true);
  });

  it('초 단위 형식도 KST로 해석', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-26T00:00:01Z')); // KST 09:00:01
    expect(isCurrentDateByDate('2026-10-26 09:00:00')).toBe(false);
  });
});
