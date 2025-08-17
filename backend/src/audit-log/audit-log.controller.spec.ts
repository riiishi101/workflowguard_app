import { Test, TestingModule } from '@nestjs/testing';
import { AuditLogController } from './audit-log.controller';
import { AuditLogService } from './audit-log.service';
import { SubscriptionService } from '../subscription/subscription.service';
import { UserService } from '../user/user.service';

describe('AuditLogController', () => {
  let controller: AuditLogController;

  const mockAuditLogService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findByUser: jest.fn(),
    findByEntity: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  const mockSubscriptionService = {
    getUserSubscription: jest.fn(),
    getTrialStatus: jest.fn(),
    getUsageStats: jest.fn(),
    checkSubscriptionExpiration: jest.fn(),
    getNextPaymentInfo: jest.fn(),
  };

  const mockUserService = {
    findOneWithSubscription: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuditLogController],
      providers: [
        {
          provide: AuditLogService,
          useValue: mockAuditLogService,
        },
        {
          provide: SubscriptionService,
          useValue: mockSubscriptionService,
        },
        {
          provide: UserService,
          useValue: mockUserService,
        },
      ],
    }).compile();

    controller = module.get<AuditLogController>(AuditLogController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
