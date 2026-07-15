import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Focus Timer (e2e)', () => {
  let app: INestApplication;
  let accessToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();

    const email = `focus-test-${Date.now()}@example.com`;
    const res = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({ email, fullName: 'Focus Tester', password: 'StrongP@ssw0rd!' });
    accessToken = res.body.data.accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  it('starts and completes a session, then reflects it in today stats', async () => {
    const startRes = await request(app.getHttpServer())
      .post('/api/focus/sessions')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ type: 'work', plannedMinutes: 25 })
      .expect(201);

    const sessionId = startRes.body.data.id;

    await request(app.getHttpServer())
      .patch(`/api/focus/sessions/${sessionId}/complete`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ actualSeconds: 1500, interrupted: false })
      .expect(200);

    const statsRes = await request(app.getHttpServer())
      .get('/api/focus/sessions/stats/today')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(statsRes.body.data.totalFocusedSeconds).toBeGreaterThanOrEqual(1500);
  });

  it('rejects completing an already-completed session', async () => {
    const startRes = await request(app.getHttpServer())
      .post('/api/focus/sessions')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ type: 'work' })
      .expect(201);
    const sessionId = startRes.body.data.id;

    await request(app.getHttpServer())
      .patch(`/api/focus/sessions/${sessionId}/complete`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ actualSeconds: 600 })
      .expect(200);

    await request(app.getHttpServer())
      .patch(`/api/focus/sessions/${sessionId}/complete`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ actualSeconds: 700 })
      .expect(400);
  });
});
