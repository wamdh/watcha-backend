import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';

const app = createApp();

describe('Health and Config Endpoints', () => {
  it('GET /health returns 200 OK', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.service).toBe('watcha-backend');
  });

  it('GET /api/v1/health returns 200 with standard meta envelope', async () => {
    const res = await request(app).get('/api/v1/health');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('ok');
    expect(res.body.meta).toBeDefined();
    expect(res.body.meta.timestamp).toBeDefined();
  });

  it('GET /api/v1/app/config returns app configuration and capabilities', async () => {
    const res = await request(app).get('/api/v1/app/config');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toBe('WATCHA');
    expect(res.body.data.features.torrentStreaming).toBe(true);
    expect(res.body.data.features.directStreaming).toBe(true);
    expect(res.body.data.features.arabicRtl).toBe(true);
  });

  it('GET /api/v1/nonexistent returns 404 with error contract', async () => {
    const res = await request(app).get('/api/v1/nonexistent');
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('ROUTE_NOT_FOUND');
  });
});
