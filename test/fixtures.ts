import { PpgWindow } from '../src/quality';

export function synthWindow(overrides: Partial<PpgWindow> = {}, seconds = 60, fs = 64): PpgWindow {
  const n = seconds * fs;
  const samples = Array.from({ length: n }, (_, i) => 0.5 + 0.4 * Math.sin((2 * Math.PI * 1.2 * i) / fs));
  return {
    windowId: '6f1c2f0e-8f5e-4d3b-9a39-0f6c1d2b7a11',
    deviceId: 'RS-0A1B2C3D4E5F',
    startedAt: '2026-10-20T08:15:00+02:00',
    samplingRateHz: fs,
    samples,
    accelerometerMagnitude: Array.from({ length: n }, () => 1.0),
    ...overrides,
  };
}
