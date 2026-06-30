import { describe, expect, it } from 'vitest';
import { formatCurrency, formatNumber, formatRelativeTime } from '../formatters';

describe('formatters', () => {
  it('formats currency with USD default', () => {
    expect(formatCurrency(12500)).toBe('$12,500');
    expect(formatCurrency(0)).toBe('$0');
  });

  it('formats numbers with grouping', () => {
    expect(formatNumber(1234567)).toBe('1,234,567');
    expect(formatNumber(null)).toBe('0');
  });

  it('formats relative time for recent dates', () => {
    const now = new Date();
    expect(formatRelativeTime(now.toISOString())).toBe('Just now');

    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
    expect(formatRelativeTime(fiveMinutesAgo.toISOString())).toBe('5m ago');
  });
});
