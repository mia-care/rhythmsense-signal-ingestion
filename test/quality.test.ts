// Unit tests for SRS-ING-003 and SRS-ING-004.
import { clippingFraction, motionFraction, signalQualityIndex } from '../src/quality';
import { synthWindow } from './fixtures';

describe('signal quality index (SRS-ING-003)', () => {
  it('scores a clean, well-perfused window above 0.9', () => {
    expect(signalQualityIndex(synthWindow())).toBeGreaterThan(0.9);
  });

  it('scores a flat (no perfusion) window as 0', () => {
    const w = synthWindow({ samples: new Array(3840).fill(0.5) });
    expect(signalQualityIndex(w)).toBe(0);
  });

  it('penalises clipped signals', () => {
    const clean = synthWindow();
    const clipped = synthWindow({ samples: clean.samples.map((s) => Math.min(s, 0.75)) });
    expect(signalQualityIndex(clipped)).toBeLessThan(signalQualityIndex(clean));
    expect(clippingFraction(clipped.samples)).toBeGreaterThan(0.1);
  });

  it('returns 0 for an empty window', () => {
    expect(signalQualityIndex(synthWindow({ samples: [] }))).toBe(0);
  });
});

describe('motion artefact rejection (SRS-ING-004)', () => {
  it('computes the moving fraction from accelerometer magnitude', () => {
    expect(motionFraction([1.0, 1.3, 1.0, 2.0])).toBeCloseTo(0.5);
  });

  it('treats a missing accelerometer channel as motionless', () => {
    expect(motionFraction(undefined)).toBe(0);
  });

  it('drives SQI to 0 when more than 20% of samples are in motion', () => {
    const w = synthWindow();
    const accel = w.samples.map((_, i) => (i % 4 === 0 ? 1.8 : 1.0));
    expect(signalQualityIndex({ ...w, accelerometerMagnitude: accel })).toBe(0);
  });
});
