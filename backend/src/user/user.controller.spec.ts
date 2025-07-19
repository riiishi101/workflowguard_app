import { Test, TestingModule } from '@nestjs/testing';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PrismaService } from '../prisma/prisma.service';

describe('UserController', () => {
  let controller: UserController;
  let userService: Partial<Record<keyof UserService, jest.Mock>>;
  let prisma: any;

  beforeEach(async () => {
    userService = {
      findOne: jest.fn(),
    };
    prisma = { user: { findUnique: jest.fn() } };
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [
        {
          provide: UserService,
          useValue: userService,
        },
        { provide: PrismaService, useValue: prisma },
        {
          provide: JwtAuthGuard,
          useValue: { canActivate: () => true },
        },
      ],
    }).compile();

    controller = module.get<UserController>(UserController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getMyPlanStatus', () => {
    const mockReq = (userId: string) => ({ user: { sub: userId } }) as any;
    it('returns trial info when trial is active', async () => {
      const now = new Date();
      const trialEndDate = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000);
      userService.findOne!.mockResolvedValue({
        id: 'user1',
        planId: 'starter',
        isTrialActive: true,
        trialEndDate,
        trialPlanId: 'professional',
      });
      const result = await controller.getMyPlanStatus(mockReq('user1'));
      expect(result).toMatchObject({
        planId: 'starter',
        isTrialActive: true,
        trialEndDate,
        trialPlanId: 'professional',
      });
      expect(result.remainingTrialDays).toBeGreaterThan(0);
    });

    it('returns 0 remainingTrialDays if trial expired', async () => {
      const now = new Date();
      const trialEndDate = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
      userService.findOne!.mockResolvedValue({
        id: 'user2',
        planId: 'starter',
        isTrialActive: false,
        trialEndDate,
        trialPlanId: 'professional',
      });
      const result = await controller.getMyPlanStatus(mockReq('user2'));
      expect(result.remainingTrialDays).toBeNull();
      expect(result.isTrialActive).toBe(false);
    });

    it('returns nulls if no trial', async () => {
      userService.findOne!.mockResolvedValue({
        id: 'user3',
        planId: 'starter',
        isTrialActive: false,
        trialEndDate: null,
        trialPlanId: null,
      });
      const result = await controller.getMyPlanStatus(mockReq('user3'));
      expect(result.trialEndDate).toBeNull();
      expect(result.trialPlanId).toBeNull();
      expect(result.remainingTrialDays).toBeNull();
    });
  });
});
