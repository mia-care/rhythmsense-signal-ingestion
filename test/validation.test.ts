// Unit tests for SRS-ING-001, SRS-ING-002 and SRS-SEC-002.
import { ppgWindowSchema } from '../src/validation';
import { synthWindow } from './fixtures';

describe('PPG window payload validation (SRS-ING-001)', () => {
  it('accepts a well-formed 60 s window', () => {
    expect(ppgWindowSchema.safeParse(synthWindow()).success).toBe(true);
  });

  it('rejects a malformed device identifier', () => {
    expect(ppgWindowSchema.safeParse(synthWindow({ deviceId: 'phone-123' })).success).toBe(false);
  });

  it('rejects non-finite samples', () => {
    const w = synthWindow();
    w.samples[10] = Number.NaN;
    expect(ppgWindowSchema.safeParse(w).success).toBe(false);
  });

  it('rejects accelerometer channels with a different length', () => {
    expect(ppgWindowSchema.safeParse(synthWindow({ accelerometerMagnitude: [1, 1, 1] })).success).toBe(false);
  });
});

describe('window duration bounds (SRS-ING-002)', () => {
  it('rejects windows shorter than 30 s', () => {
    expect(ppgWindowSchema.safeParse(synthWindow({}, 20)).success).toBe(false);
  });

  it('rejects windows longer than 120 s', () => {
    expect(ppgWindowSchema.safeParse(synthWindow({}, 150)).success).toBe(false);
  });
});

describe('no direct identifiers (SRS-SEC-002)', () => {
  it('rejects payloads carrying patient names or emails', () => {
    const w = { ...synthWindow(), patientName: 'Jane Doe', email: 'jane@example.com' };
    expect(ppgWindowSchema.safeParse(w).success).toBe(false);
  });
});
