import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Habits (e2e)', () => {
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

    const email = `habits-test-${Date.now()}@example.com`;
    const res = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({ email, fullName: 'Habits Tester', password: 'StrongP@ssw0rd!' });
    accessToken = res.body.data.accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  it('creates a habit, logs today, rejects a duplicate log, then unlogs', async () => {
    const createRes = await request(app.getHttpServer())
      .post('/api/habits')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ name: 'Meditate' })
      .expect(201);

    const habitId = createRes.body.data.id;

    await request(app.getHttpServer())
      .post(`/api/habits/${habitId}/log`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({})
      .expect(201);

    await request(app.getHttpServer())
      .post(`/api/habits/${habitId}/log`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({})
      .expect(409);

    const listRes = await request(app.getHttpServer())
      .get('/api/habits')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    const habit = listRes.body.data.find((h: { id: string }) => h.id === habitId);
    expect(habit.completedToday).toBe(true);
    expect(habit.currentStreak).toBe(1);

    await request(app.getHttpServer())
      .delete(`/api/habits/${habitId}/log`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);
  });
});
