import { describe, expect, it } from 'vitest';
import { decodePolyline } from '../polylineUtils';

describe('polylineUtils', () => {
  it('decodes an encoded polyline string', () => {
    const encoded = '_p~iF~ps|U_ulLnnqC_mqNvxq`@';
    const decoded = decodePolyline(encoded);

    expect(decoded.length).toBeGreaterThan(1);
    expect(decoded[0].lat).toBeCloseTo(38.5, 1);
    expect(decoded[0].lng).toBeCloseTo(-120.2, 1);
  });

  it('returns empty array for invalid input', () => {
    expect(decodePolyline('')).toEqual([]);
    expect(decodePolyline(null)).toEqual([]);
  });
});
