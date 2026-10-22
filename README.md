# RhythmSense Signal Ingestion Service

Software item of **RhythmSense AI**, a fictional demo product used to showcase
[P4SaMD](https://mia-care.io). Not a real medical device.

RhythmSense AI is an over-the-counter software function that analyses
photoplethysmography (PPG) recorded by a wrist wearable, identifies episodes of
irregular heart rhythm suggestive of atrial fibrillation (AF) and notifies the
user. FDA device class II (21 CFR 870.2790, product code QDA), IEC 62304
software safety class B.

This service receives PPG windows from the mobile app and:

- validates the payload schema and window duration (SRS-ING-001, SRS-ING-002);
- rejects payloads carrying direct identifiers (SRS-SEC-002);
- computes a signal-quality index from perfusion, clipping and motion (SRS-ING-003, SRS-ING-004);
- forwards good-quality windows to the AF Inference Engine (SRS-ING-005).

## Build and test

```bash
npm ci
npm run build
npm run test:ci   # writes reports/junit.xml
```

CI (`.github/workflows/ci.yml`) publishes the JUnit report as the
`junit-report` artifact, which P4SaMD acquires automatically.
