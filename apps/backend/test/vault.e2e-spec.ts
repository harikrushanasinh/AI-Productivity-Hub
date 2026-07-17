import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Password Vault (e2e)', () => {
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

    const email = `vault-test-${Date.now()}@example.com`;
    const res = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({ email, fullName: 'Vault Tester', password: 'StrongP@ssw0rd!' });
    accessToken = res.body.data.accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  it('never exposes password/ciphertext fields in list or get responses', async () => {
    const createRes = await request(app.getHttpServer())
      .post('/api/vault/items')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ title: 'GitHub', username: 'jane@example.com', password: 'hunter2-but-better' })
      .expect(201);

    const created = createRes.body.data;
    expect(created).not.toHaveProperty('password');
    expect(created).not.toHaveProperty('passwordCiphertext');
    expect(created).not.toHaveProperty('passwordIv');

    const listRes = await request(app.getHttpServer())
      .get('/api/vault/items')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    const jsonString = JSON.stringify(listRes.body);
    expect(jsonString).not.toContain('hunter2-but-better');
    expect(jsonString).not.toContain('passwordCiphertext');
  });

  it('reveal returns the exact original plaintext password', async () => {
    const createRes = await request(app.getHttpServer())
      .post('/api/vault/items')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ title: 'Bank', password: 'Correct-Horse-Battery-Staple-99' })
      .expect(201);

    const itemId = createRes.body.data.id;

    const revealRes = await request(app.getHttpServer())
      .post(`/api/vault/items/${itemId}/reveal`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({})
      .expect(201);

    expect(revealRes.body.data.password).toBe('Correct-Horse-Battery-Staple-99');
  });
});
