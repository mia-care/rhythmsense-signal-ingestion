import axios from 'axios';
import { buildApp, InferenceClient } from './app';

const inferenceUrl = process.env.INFERENCE_URL ?? 'http://rhythmsense-af-inference:8000';

const inference: InferenceClient = {
  async classify(input) {
    const { data } = await axios.post(`${inferenceUrl}/v1/classify`, input, { timeout: 5000 });
    return data;
  },
};

buildApp(inference)
  .listen({ port: Number(process.env.HTTP_PORT ?? 3000), host: '0.0.0.0' })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
