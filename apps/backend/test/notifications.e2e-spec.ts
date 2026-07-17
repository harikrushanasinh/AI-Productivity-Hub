import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Notifications (e2e)', () => {
  let app: INestApplication;
  let accessToken: string;
  let userId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();

    const email = `notifications-test-${Date.now()}@example.com`;
    const res = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({ email, fullName: 'Notifications Tester', password: 'StrongP@ssw0rd!' });
    accessToken = res.body.data.accessToken;
    userId = res.body.data.user.id;
  });

  afterAll(async () => {
    await app.close();
  });

  it('creates a notification, reflects it in unread count, then marks it read', async () => {
    await request(app.getHttpServer())
      .post('/api/notifications')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ ownerId: userId, title: 'Welcome to AI Productivity Hub' })
      .expect(201);

    const countRes = await request(app.getHttpServer())
      .get('/api/notifications/unread-count')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);
    expect(countRes.body.data.count).toBeGreaterThanOrEqual(1);

    const listRes = await request(app.getHttpServer())
      .get('/api/notifications')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);
    const notificationId = listRes.body.data[0].id;

    await request(app.getHttpServer())
      .patch(`/api/notifications/${notificationId}/read`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    await request(app.getHttpServer())
      .patch('/api/notifications/read-all')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    const finalCountRes = await request(app.getHttpServer())
      .get('/api/notifications/unread-count')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);
    expect(finalCountRes.body.data.count).toBe(0);
  });
});
