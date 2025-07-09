import { Test, TestingModule } from '@nestjs/testing';
import { WebhookController } from './webhook.controller';
import { WebhookService } from './webhook.service';
import { UserService } from '../user/user.service';
import { PrismaService } from '../prisma/prisma.service';

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
});
