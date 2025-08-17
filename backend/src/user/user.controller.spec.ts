import { Test, TestingModule } from '@nestjs/testing';
import { UserController } from './user.controller';
import { UserService } from './user.service';

describe('UserController', () => {
  let controller: UserController;

  const mockUserService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    findByEmail: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    findOneWithSubscription: jest.fn(),
    getPlanById: jest.fn(),
    getOverageStats: jest.fn(),
    getApiKeys: jest.fn(),
    createApiKey: jest.fn(),
    revokeApiKey: jest.fn(),
    revokeAllApiKeys: jest.fn(),
    createTrialSubscription: jest.fn(),
    checkTrialAccess: jest.fn(),
    upgradeSubscription: jest.fn(),
    getUserPlan: jest.fn(),
    getUserOverages: jest.fn(),
    cancelMySubscription: jest.fn(),
    getWorkflowCountByOwner: jest.fn(),
    getNotificationSettings: jest.fn(),
    updateNotificationSettings: jest.fn(),
    deleteApiKey: jest.fn(),
    getMe: jest.fn(),
    updateMe: jest.fn(),
    deleteMe: jest.fn(),
    getMySubscription: jest.fn(),
    disconnectHubSpot: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [
        {
          provide: UserService,
          useValue: mockUserService,
        },
      ],
    }).compile();

    controller = module.get<UserController>(UserController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
