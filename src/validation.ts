/**
 * Validation of PPG window uploads coming from the RhythmSense mobile app.
 *
 * Traces to: SRS-ING-001 (payload schema), SRS-ING-002 (duration bounds),
 * SRS-SEC-002 (no direct identifiers accepted).
 */

import { z } from 'zod';

export const MIN_WINDOW_SECONDS = 30;
export const MAX_WINDOW_SECONDS = 120;

export const ppgWindowSchema = z
  .object({
    windowId: z.string().uuid(),
    deviceId: z.string().regex(/^RS-[A-F0-9]{12}$/),
    startedAt: z.string().datetime({ offset: true }),
    samplingRateHz: z.number().min(25).max(512),
    samples: z.array(z.number().finite()).min(1),
    accelerometerMagnitude: z.array(z.number().nonnegative()).optional(),
  })
  .strict()
  .superRefine((w, ctx) => {
    const seconds = w.samples.length / w.samplingRateHz;
    if (seconds < MIN_WINDOW_SECONDS || seconds > MAX_WINDOW_SECONDS) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['samples'],
        message: `window duration ${seconds.toFixed(1)}s outside [${MIN_WINDOW_SECONDS}, ${MAX_WINDOW_SECONDS}]`,
      });
    }
    if (w.accelerometerMagnitude && w.accelerometerMagnitude.length !== w.samples.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['accelerometerMagnitude'],
        message: 'accelerometer and PPG sample counts differ',
      });
    }
  });

export type ValidatedWindow = z.infer<typeof ppgWindowSchema>;
