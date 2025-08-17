import { Test, TestingModule } from '@nestjs/testing';
import { SubscriptionService } from './subscription.service';
import { PrismaService } from '../prisma/prisma.service';
import { HttpException } from '@nestjs/common';

describe('SubscriptionService', () => {
  let service: SubscriptionService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    subscription: {
      update: jest.fn(),
      findFirst: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SubscriptionService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<SubscriptionService>(SubscriptionService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getUserSubscription', () => {
    const userId = 'test-user-id';
    const mockUser = {
      id: userId,
      subscription: {
        id: 'sub-1',
        planId: 'professional',
        status: 'active',
        createdAt: new Date(),
        trialEndDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
      workflows: [],
    };

    it('should return subscription info with professional plan details', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.getUserSubscription(userId);

      expect(result.planId).toBe('professional');
      expect(result.planName).toBe('Professional Plan');
      expect(result.price).toBe(49);
      expect(result.limits).toEqual({
        workflows: 25,
        versionHistory: 90,
        teamMembers: 5,
      });
      expect(result.features).toContain('workflow_selection');
      expect(result.features).toContain('priority_whatsapp_support');
    });

    it('should return starter plan details if no subscription exists', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        ...mockUser,
        subscription: null,
      });

      const result = await service.getUserSubscription(userId);

      expect(result.planId).toBe('starter');
      expect(result.planName).toBe('Starter Plan');
      expect(result.price).toBe(19);
      expect(result.limits).toEqual({
        workflows: 5,
        versionHistory: 30,
        teamMembers: 1,
      });
    });

    it('should throw error if user not found', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.getUserSubscription(userId)).rejects.toThrow(
        'User not found',
      );
    });
  });

  describe('getTrialStatus', () => {
    const userId = 'test-user-id';
    const mockUser = {
      id: userId,
      subscription: {
        id: 'sub-1',
        planId: 'professional',
        status: 'active',
        trialEndDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      },
    };

    it('should return active trial status', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.getTrialStatus(userId);

      expect(result.isTrialActive).toBe(true);
      expect(result.trialDaysRemaining).toBeGreaterThan(6);
      expect(result.trialDaysRemaining).toBeLessThanOrEqual(7);
      expect(result.isTrialExpired).toBe(false);
    });

    it('should return expired trial status', async () => {
      const expiredUser = {
        ...mockUser,
        subscription: {
          ...mockUser.subscription,
          trialEndDate: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
        },
      };
      mockPrismaService.user.findUnique.mockResolvedValue(expiredUser);

      const result = await service.getTrialStatus(userId);

      expect(result.isTrialActive).toBe(false);
      expect(result.isTrialExpired).toBe(true);
      expect(result.trialDaysRemaining).toBe(0);
    });

    it('should throw error for non-existent user', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.getTrialStatus(userId)).rejects.toThrow(
        'User not found',
      );
    });
  });

  describe('checkSubscriptionExpiration', () => {
    const userId = 'test-user-id';
    const mockUser = {
      id: userId,
      subscription: {
        id: 'sub-1',
        planId: 'professional',
        status: 'active',
        nextBillingDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      },
    };

    it('should return not expired for active subscription', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.checkSubscriptionExpiration(userId);

      expect(result.isExpired).toBe(false);
    });

    it('should mark subscription as expired when past billing date', async () => {
      const expiredUser = {
        ...mockUser,
        subscription: {
          ...mockUser.subscription,
          nextBillingDate: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
        },
      };
      mockPrismaService.user.findUnique.mockResolvedValue(expiredUser);
      mockPrismaService.subscription.update.mockResolvedValue({
        status: 'expired',
      });

      const result = await service.checkSubscriptionExpiration(userId);

      expect(result.isExpired).toBe(true);
      expect(result.message).toBe('Subscription has expired');
      expect(mockPrismaService.subscription.update).toHaveBeenCalledWith({
        where: { id: 'sub-1' },
        data: { status: 'expired' },
      });
    });

    it('should handle case with no subscription', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        ...mockUser,
        subscription: null,
      });

      const result = await service.checkSubscriptionExpiration(userId);

      expect(result.isExpired).toBe(false);
      expect(result.message).toBe('No subscription found');
    });
  });

  describe('getNextPaymentInfo', () => {
    const userId = 'test-user-id';
    const mockUser = {
      id: userId,
      subscription: {
        id: 'sub-1',
        planId: 'professional',
        status: 'active',
        nextBillingDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      },
    };

    it('should return next payment info for active subscription', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.getNextPaymentInfo(userId);

      expect(result.hasSubscription).toBe(true);
      expect(result.nextPayment).toBeDefined();
      if (result.nextPayment) {
        expect(result.nextPayment.currency).toBe('USD');
        expect(result.nextPayment.amount).toBe(49); // Professional plan price
        expect(result.nextPayment.daysUntil).toBeGreaterThan(6);
        expect(result.nextPayment.daysUntil).toBeLessThanOrEqual(7);
        expect(result.nextPayment.isOverdue).toBe(false);
      }
    });

    it('should return no subscription info when no subscription exists', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        ...mockUser,
        subscription: null,
      });

      const result = await service.getNextPaymentInfo(userId);

      expect(result.hasSubscription).toBe(false);
    });

    it('should indicate overdue payment for past billing date', async () => {
      const overdueUser = {
        ...mockUser,
        subscription: {
          ...mockUser.subscription,
          nextBillingDate: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
        },
      };
      mockPrismaService.user.findUnique.mockResolvedValue(overdueUser);

      const result = await service.getNextPaymentInfo(userId);

      expect(result.hasSubscription).toBe(true);
      expect(result.nextPayment).toBeDefined();
      if (result.nextPayment) {
        expect(result.nextPayment.isOverdue).toBe(true);
        expect(result.nextPayment.daysUntil).toBeLessThan(0);
      }
    });
  });

  describe('getUsageStats', () => {
    const userId = 'test-user-id';
    const mockUser = {
      id: userId,
      subscription: {
        id: 'sub-1',
        planId: 'professional',
        status: 'active',
      },
      workflows: Array(3).fill({ id: 'workflow-1' }), // 3 workflows
    };

    it('should return usage stats for user with workflows', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.getUsageStats(userId);

      expect(result.workflows.used).toBe(3);
      expect(result.workflows.limit).toBe(5);
      expect(result.workflows.percentage).toBe(60);
      expect(result.versionHistory).toBeDefined();
      expect(result.teamMembers).toBeDefined();
      expect(result.storage).toBeDefined();
    });

    it('should throw error for non-existent user', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.getUsageStats(userId)).rejects.toThrow(
        'User not found',
      );
    });

    it('should return zero usage for user with no workflows', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        ...mockUser,
        workflows: [],
      });

      const result = await service.getUsageStats(userId);

      expect(result.workflows.used).toBe(0);
      expect(result.workflows.percentage).toBe(0);
    });
  });
});
