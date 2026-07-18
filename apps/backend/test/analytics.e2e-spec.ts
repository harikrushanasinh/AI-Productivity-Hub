import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Analytics (e2e)', () => {
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

    const email = `analytics-test-${Date.now()}@example.com`;
    const res = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({ email, fullName: 'Analytics Tester', password: 'StrongP@ssw0rd!' });
    accessToken = res.body.data.accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  it('aggregates real data seeded through each module\'s own endpoints', async () => {
    // Seed two tasks, one marked done.
    const taskRes = await request(app.getHttpServer())
      .post('/api/tasks')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ title: 'Ship the release' })
      .expect(201);
    await request(app.getHttpServer())
      .patch(`/api/tasks/${taskRes.body.data.id}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ status: 'done' })
      .expect(200);

    await request(app.getHttpServer())
      .post('/api/tasks')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ title: 'Write release notes' })
      .expect(201);

    // Seed income and an expense this month.
    const today = new Date().toISOString().slice(0, 10);
    await request(app.getHttpServer())
      .post('/api/expenses')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ title: 'Paycheck', amountMinor: 300000, spentOn: today, type: 'income' })
      .expect(201);
    await request(app.getHttpServer())
      .post('/api/expenses')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ title: 'Groceries', amountMinor: 5000, spentOn: today, type: 'expense' })
      .expect(201);

    const dashboardRes = await request(app.getHttpServer())
      .get('/api/analytics/dashboard')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    const { tasks, expenses } = dashboardRes.body.data;
    expect(tasks.total).toBe(2);
    expect(tasks.done).toBe(1);
    expect(tasks.completionRate).toBe(50);
    expect(expenses.monthIncome).toBe(300000);
    expect(expenses.monthExpense).toBe(5000);
    expect(expenses.monthNet).toBe(295000);
  });
});
