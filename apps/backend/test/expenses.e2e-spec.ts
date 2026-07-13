import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Expenses (e2e)', () => {
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

    const email = `expenses-test-${Date.now()}@example.com`;
    const res = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({ email, fullName: 'Expenses Tester', password: 'StrongP@ssw0rd!' });
    accessToken = res.body.data.accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  it('rejects a non-positive amount', async () => {
    await request(app.getHttpServer())
      .post('/api/expenses')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ title: 'Free sample', amountMinor: 0, spentOn: '2026-07-13' })
      .expect(400);
  });

  it('computes an accurate income/expense/net summary', async () => {
    await request(app.getHttpServer())
      .post('/api/expenses')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ title: 'Salary', amountMinor: 500000, spentOn: '2026-07-01', type: 'income' })
      .expect(201);

    await request(app.getHttpServer())
      .post('/api/expenses')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ title: 'Rent', amountMinor: 150000, spentOn: '2026-07-02', type: 'expense' })
      .expect(201);

    const res = await request(app.getHttpServer())
      .get('/api/expenses/summary')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(res.body.data.income).toBe(500000);
    expect(res.body.data.expense).toBe(150000);
    expect(res.body.data.net).toBe(350000);
  });
});
