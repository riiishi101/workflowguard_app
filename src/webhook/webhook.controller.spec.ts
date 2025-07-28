import { UserService } from '../user/user.service';
import { PrismaService } from '../prisma/prisma.service';
import { Test, TestingModule } from '@nestjs/testing';
import { WebhookController } from './webhook.controller';
import { WebhookService } from './webhook.service';

describe('WebhookController', () => {
  let controller: WebhookController;
  let webhookService: any;
  let userService: any;
  let prisma: any;

  beforeEach(async () => {
    webhookService = { create: jest.fn(), findAllByUser: jest.fn(), remove: jest.fn() };
    userService = { findOne: jest.fn() };
    prisma = { user: { findUnique: jest.fn() } };
    const module: TestingModule = await Test.createTestingModule({
      controllers: [WebhookController],
      providers: [
        { provide: WebhookService, useValue: webhookService },
        { provide: UserService, useValue: userService },
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();
    controller = module.get<WebhookController>(WebhookController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a webhook', async () => {
      const createWebhookDto = { url: 'http://example.com/webhook' };
      const user = { id: '1' };
      userService.findOne.mockResolvedValue(user);
      webhookService.create.mockResolvedValue({ id: '1', url: 'http://example.com/webhook' });

      const result = await controller.create(createWebhookDto, user);

      expect(userService.findOne).toHaveBeenCalledWith({ where: { id: user.id } });
      expect(webhookService.create).toHaveBeenCalledWith(createWebhookDto, user);
      expect(result).toEqual({ id: '1', url: 'http://example.com/webhook' });
    });
  });

  describe('findAllByUser', () => {
    it('should find all webhooks for a user', async () => {
      const user = { id: '1' };
      userService.findOne.mockResolvedValue(user);
      webhookService.findAllByUser.mockResolvedValue([{ id: '1', url: 'http://example.com/webhook' }]);

      const result = await controller.findAllByUser(user);

      expect(userService.findOne).toHaveBeenCalledWith({ where: { id: user.id } });
      expect(webhookService.findAllByUser).toHaveBeenCalledWith(user);
      expect(result).toEqual([{ id: '1', url: 'http://example.com/webhook' }]);
    });
  });

  describe('remove', () => {
    it('should remove a webhook', async () => {
      const user = { id: '1' };
      userService.findOne.mockResolvedValue(user);
      webhookService.remove.mockResolvedValue({ id: '1', url: 'http://example.com/webhook' });

      const result = await controller.remove('1', user);

      expect(userService.findOne).toHaveBeenCalledWith({ where: { id: user.id } });
      expect(webhookService.remove).toHaveBeenCalledWith('1', user);
      expect(result).toEqual({ id: '1', url: 'http://example.com/webhook' });
    });
  });
}); 