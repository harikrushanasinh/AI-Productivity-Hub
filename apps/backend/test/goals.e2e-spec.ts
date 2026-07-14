import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Goals (e2e)', () => {
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

    const email = `goals-test-${Date.now()}@example.com`;
    const res = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({ email, fullName: 'Goals Tester', password: 'StrongP@ssw0rd!' });
    accessToken = res.body.data.accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  it('derives progress from milestone completion ratio', async () => {
    const goalRes = await request(app.getHttpServer())
      .post('/api/goals')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ title: 'Learn Spanish' })
      .expect(201);
    const goalId = goalRes.body.data.id;

    const m1 = await request(app.getHttpServer())
      .post(`/api/goals/${goalId}/milestones`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ title: 'Finish beginner course' })
      .expect(201);

    await request(app.getHttpServer())
      .post(`/api/goals/${goalId}/milestones`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ title: 'Have a 10-minute conversation' })
      .expect(201);

    await request(app.getHttpServer())
      .patch(`/api/goals/${goalId}/milestones/${m1.body.data.id}/toggle`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    const getRes = await request(app.getHttpServer())
      .get(`/api/goals/${goalId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(getRes.body.data.computedProgress).toBe(50);
  });
});
