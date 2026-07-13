import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Journal (e2e)', () => {
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

    const email = `journal-test-${Date.now()}@example.com`;
    const res = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({ email, fullName: 'Journal Tester', password: 'StrongP@ssw0rd!' });
    accessToken = res.body.data.accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  it('creates an entry, then rejects a duplicate for the same date', async () => {
    const entryDate = '2026-07-13';

    await request(app.getHttpServer())
      .post('/api/journal/entries')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ entryDate, content: 'First entry of the day', mood: 4 })
      .expect(201);

    await request(app.getHttpServer())
      .post('/api/journal/entries')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ entryDate, content: 'Trying again', mood: 3 })
      .expect(409);
  });

  it('rejects an out-of-range mood value', async () => {
    await request(app.getHttpServer())
      .post('/api/journal/entries')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ entryDate: '2026-07-14', content: 'Bad mood value', mood: 9 })
      .expect(400);
  });
});
