import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Teams (e2e)', () => {
  let app: INestApplication;
  let ownerToken: string;
  let memberToken: string;
  let memberEmail: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();

    const ownerEmail = `teams-owner-${Date.now()}@example.com`;
    const ownerRes = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({ email: ownerEmail, fullName: 'Team Owner', password: 'StrongP@ssw0rd!' });
    ownerToken = ownerRes.body.data.accessToken;

    memberEmail = `teams-member-${Date.now()}@example.com`;
    const memberRes = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({ email: memberEmail, fullName: 'Team Member', password: 'StrongP@ssw0rd!' });
    memberToken = memberRes.body.data.accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  it('creates a team, invites, accepts, and enforces role-based permissions', async () => {
    const teamRes = await request(app.getHttpServer())
      .post('/api/teams')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ name: 'Product Squad' })
      .expect(201);
    const teamId = teamRes.body.data.id;

    const inviteRes = await request(app.getHttpServer())
      .post(`/api/teams/${teamId}/invitations`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ email: memberEmail })
      .expect(201);
    const token = inviteRes.body.data.token;

    await request(app.getHttpServer())
      .post(`/api/teams/invitations/${token}/accept`)
      .set('Authorization', `Bearer ${memberToken}`)
      .send({})
      .expect(201);

    const membersRes = await request(app.getHttpServer())
      .get(`/api/teams/${teamId}/members`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .expect(200);
    expect(membersRes.body.data).toHaveLength(2);

    // A plain member cannot delete the team.
    await request(app.getHttpServer())
      .delete(`/api/teams/${teamId}`)
      .set('Authorization', `Bearer ${memberToken}`)
      .expect(403);

    // The owner cannot leave (must delete or transfer instead).
    await request(app.getHttpServer())
      .post(`/api/teams/${teamId}/leave`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .expect(403);
  });
});
