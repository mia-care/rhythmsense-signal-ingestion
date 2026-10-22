// Unit tests for SRS-API-001, SRS-API-002 and SRS-ING-005.
import { buildApp, InferenceClient } from '../src/app';
import { synthWindow } from './fixtures';

function fakeInference(): InferenceClient & { calls: number } {
  const client = {
    calls: 0,
    async classify() {
      client.calls += 1;
      return { result: 'regular', probability: 0.08, model_version: '1.3.0' };
    },
  };
  return client;
}

describe('POST /v1/windows', () => {
  it('forwards a good-quality window to the inference engine (SRS-ING-005)', async () => {
    const inference = fakeInference();
    const res = await buildApp(inference).inject({ method: 'POST', url: '/v1/windows', payload: synthWindow() });
    expect(res.statusCode).toBe(202);
    expect(res.json().forwarded).toBe(true);
    expect(inference.calls).toBe(1);
  });

  it('does not forward a low-quality window and says why (SRS-API-002)', async () => {
    const inference = fakeInference();
    const payload = synthWindow({ samples: new Array(3840).fill(0.5) });
    const res = await buildApp(inference).inject({ method: 'POST', url: '/v1/windows', payload });
    expect(res.json()).toMatchObject({ accepted: true, forwarded: false, reason: 'low_signal_quality' });
    expect(inference.calls).toBe(0);
  });

  it('returns 400 with field-level issues for an invalid payload (SRS-API-001)', async () => {
    const res = await buildApp(fakeInference()).inject({ method: 'POST', url: '/v1/windows', payload: { foo: 1 } });
    expect(res.statusCode).toBe(400);
    expect(res.json().issues.length).toBeGreaterThan(0);
  });

  it.skip('retries the inference call once on timeout (SRS-ING-006, not implemented yet)', () => {
    // Pending: retry policy not implemented, see change request CR-RS-007.
  });
});
