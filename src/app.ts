/**
 * HTTP API of the Signal Ingestion Service.
 *
 * Traces to: SRS-API-001 (window upload), SRS-API-002 (rejection reasons),
 * SRS-ING-005 (forwarding to the inference engine).
 */

import Fastify, { FastifyInstance } from 'fastify';
import { ppgWindowSchema } from './validation';
import { signalQualityIndex } from './quality';

export interface InferenceClient {
  classify(input: {
    window_id: string;
    sampling_rate_hz: number;
    samples: number[];
    signal_quality: number;
  }): Promise<{ result: string; probability: number | null; model_version: string }>;
}

export const MIN_FORWARD_SQI = 0.7;

export function buildApp(inference: InferenceClient): FastifyInstance {
  const app = Fastify({ logger: false });

  app.get('/health', async () => ({ status: 'ok' }));

  app.post('/v1/windows', async (request, reply) => {
    const parsed = ppgWindowSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({
        accepted: false,
        reason: 'invalid_payload',
        issues: parsed.error.issues.map((i) => ({ path: i.path.join('.'), message: i.message })),
      });
    }
    const window = parsed.data;
    const sqi = signalQualityIndex(window);
    if (sqi < MIN_FORWARD_SQI) {
      return reply.status(202).send({ accepted: true, forwarded: false, reason: 'low_signal_quality', sqi });
    }
    const classification = await inference.classify({
      window_id: window.windowId,
      sampling_rate_hz: window.samplingRateHz,
      samples: window.samples,
      signal_quality: sqi,
    });
    return reply.status(202).send({ accepted: true, forwarded: true, sqi, classification });
  });

  return app;
}
