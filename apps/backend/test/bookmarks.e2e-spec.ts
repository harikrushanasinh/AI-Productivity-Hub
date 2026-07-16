import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Bookmarks (e2e)', () => {
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

    const email = `bookmarks-test-${Date.now()}@example.com`;
    const res = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({ email, fullName: 'Bookmarks Tester', password: 'StrongP@ssw0rd!' });
    accessToken = res.body.data.accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  it('rejects a URL without a protocol', async () => {
    await request(app.getHttpServer())
      .post('/api/bookmarks')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ url: 'example.com', title: 'Missing protocol' })
      .expect(400);
  });

  it('creates a bookmark with an auto-derived favicon and toggles favorite', async () => {
    const createRes = await request(app.getHttpServer())
      .post('/api/bookmarks')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ url: 'https://angular.dev/guide', title: 'Angular Guide' })
      .expect(201);

    expect(createRes.body.data.faviconUrl).toContain('angular.dev');

    const bookmarkId = createRes.body.data.id;

    const updateRes = await request(app.getHttpServer())
      .patch(`/api/bookmarks/${bookmarkId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ isFavorite: true })
      .expect(200);

    expect(updateRes.body.data.isFavorite).toBe(true);
  });
});
