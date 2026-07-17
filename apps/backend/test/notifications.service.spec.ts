import { Test, TestingModule } from '@nestjs/testing';
import { NotificationsService } from '../src/modules/notifications/services/notifications.service';
import { NotificationsRepository } from '../src/modules/notifications/repositories/notifications.repository';
import { NotificationsGateway } from '../src/modules/notifications/gateways/notifications.gateway';
import { NotificationType } from '../src/modules/notifications/entities/notification.entity';

describe('NotificationsService', () => {
  let service: NotificationsService;
  let repository: jest.Mocked<NotificationsRepository>;
  let gateway: jest.Mocked<NotificationsGateway>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        {
          provide: NotificationsRepository,
          useValue: { create: jest.fn(), save: jest.fn(), findById: jest.fn() },
        },
        { provide: NotificationsGateway, useValue: { emitToUser: jest.fn() } },
      ],
    }).compile();

    service = module.get(NotificationsService);
    repository = module.get(NotificationsRepository);
    gateway = module.get(NotificationsGateway);
  });

  it('persists the notification AND pushes it live over the gateway', async () => {
    const dto = { ownerId: 'user-1', title: 'Task due soon', type: NotificationType.REMINDER };
    const created = { id: 'notif-1', ...dto };

    repository.create.mockReturnValue(created as any);
    repository.save.mockResolvedValue(created as any);

    const result = await service.create(dto as any);

    expect(repository.save).toHaveBeenCalledWith(created);
    expect(gateway.emitToUser).toHaveBeenCalledWith('user-1', created);
    expect(result).toEqual(created);
  });
});
