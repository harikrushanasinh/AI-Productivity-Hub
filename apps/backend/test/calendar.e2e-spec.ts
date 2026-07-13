import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';

/**
 * NOTE: assumes a running Postgres reachable via the DB_* env vars
 * (see docker-compose.yml). Run with: docker compose up -d postgres && npm run test:e2e
 */
describe('Calendar (e2e)', () => {
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

    const email = `calendar-test-${Date.now()}@example.com`;
    const res = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({ email, fullName: 'Calendar Tester', password: 'StrongP@ssw0rd!' });
    accessToken = res.body.data.accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  it('rejects an event where endAt is before startAt', async () => {
    await request(app.getHttpServer())
      .post('/api/calendar/events')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        title: 'Invalid range',
        startAt: '2026-08-01T10:00:00.000Z',
        endAt: '2026-08-01T09:00:00.000Z',
      })
      .expect(400);
  });

  it('creates, lists, and soft-deletes an event', async () => {
    const createRes = await request(app.getHttpServer())
      .post('/api/calendar/events')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        title: 'Team sync',
        startAt: '2026-08-01T09:00:00.000Z',
        endAt: '2026-08-01T09:30:00.000Z',
      })
      .expect(201);

    const eventId = createRes.body.data.id;

    await request(app.getHttpServer())
      .get('/api/calendar/events')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200)
      .expect((res) => {
        expect(res.body.data.some((e: { id: string }) => e.id === eventId)).toBe(true);
      });

    await request(app.getHttpServer())
      .delete(`/api/calendar/events/${eventId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);
  });
});
