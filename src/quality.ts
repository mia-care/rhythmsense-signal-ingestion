/**
 * Signal-quality index (SQI) for PPG windows.
 *
 * Software item: Signal Ingestion Service (IEC 62304 class B).
 * Traces to: SRS-ING-003 (signal quality index), SRS-ING-004 (motion artefact rejection).
 */

export interface PpgWindow {
  windowId: string;
  deviceId: string;
  startedAt: string;
  samplingRateHz: number;
  samples: number[];
  accelerometerMagnitude?: number[];
}

/** Accelerometer magnitude (g) above which a sample is considered motion-corrupted. */
export const MOTION_THRESHOLD_G = 1.25;
/** Maximum fraction of motion-corrupted samples before the window is rejected. */
export const MAX_MOTION_FRACTION = 0.2;

function mean(values: number[]): number {
  return values.reduce((acc, v) => acc + v, 0) / values.length;
}

function std(values: number[]): number {
  const m = mean(values);
  return Math.sqrt(mean(values.map((v) => (v - m) ** 2)));
}

/**
 * Fraction of samples clipped at the ADC rails: a sample counts as clipped
 * when it sits on the min or max value and repeats the previous sample
 * (a flat plateau), so the natural peaks of a clean waveform do not count.
 */
export function clippingFraction(samples: number[]): number {
  const min = Math.min(...samples);
  const max = Math.max(...samples);
  if (min === max) return 1;
  let clipped = 0;
  for (let i = 1; i < samples.length; i += 1) {
    const s = samples[i];
    if ((s === min || s === max) && s === samples[i - 1]) clipped += 1;
  }
  return clipped / samples.length;
}

/** Fraction of samples recorded while the wearer was moving. */
export function motionFraction(accel: number[] | undefined): number {
  if (!accel || accel.length === 0) return 0;
  return accel.filter((a) => a > MOTION_THRESHOLD_G).length / accel.length;
}

/**
 * Compute the signal-quality index in [0, 1].
 * Combines perfusion (signal variability), clipping and motion.
 */
export function signalQualityIndex(window: PpgWindow): number {
  const { samples } = window;
  if (samples.length === 0) return 0;
  const perfusion = Math.min(std(samples) / 0.25, 1);
  const clipping = 1 - Math.min(clippingFraction(samples) * 10, 1);
  const motion = 1 - Math.min(motionFraction(window.accelerometerMagnitude) / MAX_MOTION_FRACTION, 1);
  const sqi = perfusion * clipping * motion;
  return Math.round(sqi * 1000) / 1000;
}
