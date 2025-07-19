import { Test, TestingModule } from '@nestjs/testing';
import { OverageService } from './overage.service';
import { PrismaService } from '../prisma/prisma.service';

describe('OverageService', () => {
  let service: OverageService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OverageService,
        {
          provide: PrismaService,
          useValue: {
            overage: {
              findMany: jest.fn(),
              findUnique: jest.fn(),
              update: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<OverageService>(OverageService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  describe('findAll', () => {
    it('should return all overages without filters', async () => {
      const mockOverages = [{ id: '1', amount: 100 }];
      (prisma.overage.findMany as jest.Mock).mockResolvedValue(mockOverages);
      const result = await service.findAll();
      expect(result).toEqual(mockOverages);
      expect(prisma.overage.findMany).toHaveBeenCalledWith({
        where: {},
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
        },
        orderBy: { periodStart: 'desc' },
      });
    });

    it('should return overages with userId filter', async () => {
      const mockOverages = [{ id: '1', amount: 100, userId: 'user1' }];
      (prisma.overage.findMany as jest.Mock).mockResolvedValue(mockOverages);
      const result = await service.findAll({ userId: 'user1' });
      expect(result).toEqual(mockOverages);
      expect(prisma.overage.findMany).toHaveBeenCalledWith({
        where: { userId: 'user1' },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
        },
        orderBy: { periodStart: 'desc' },
      });
    });

    it('should return overages with billed filter', async () => {
      const mockOverages = [{ id: '1', amount: 100, billed: true }];
      (prisma.overage.findMany as jest.Mock).mockResolvedValue(mockOverages);
      const result = await service.findAll({ billed: true });
      expect(result).toEqual(mockOverages);
      expect(prisma.overage.findMany).toHaveBeenCalledWith({
        where: { billed: true },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
        },
        orderBy: { periodStart: 'desc' },
      });
    });

    it('should return overages with period filters', async () => {
      const mockOverages = [{ id: '1', amount: 100 }];
      const periodStart = new Date('2024-01-01');
      const periodEnd = new Date('2024-01-31');
      (prisma.overage.findMany as jest.Mock).mockResolvedValue(mockOverages);
      const result = await service.findAll({ periodStart, periodEnd });
      expect(result).toEqual(mockOverages);
      expect(prisma.overage.findMany).toHaveBeenCalledWith({
        where: { periodStart, periodEnd },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
        },
        orderBy: { periodStart: 'desc' },
      });
    });

    it('should return empty array when no overages found', async () => {
      (prisma.overage.findMany as jest.Mock).mockResolvedValue([]);
      const result = await service.findAll();
      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('should return a single overage', async () => {
      const mockOverage = { id: '1', amount: 100 };
      (prisma.overage.findUnique as jest.Mock).mockResolvedValue(mockOverage);
      const result = await service.findOne('1');
      expect(result).toEqual(mockOverage);
      expect(prisma.overage.findUnique).toHaveBeenCalledWith({
        where: { id: '1' },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
        },
      });
    });

    it('should return null when overage not found', async () => {
      (prisma.overage.findUnique as jest.Mock).mockResolvedValue(null);
      const result = await service.findOne('999');
      expect(result).toBeNull();
    });
  });

  describe('markAsBilled', () => {
    it('should mark overage as billed', async () => {
      const mockResult = { id: '1', billed: true };
      (prisma.overage.update as jest.Mock).mockResolvedValue(mockResult);
      const result = await service.markAsBilled('1');
      expect(result).toEqual(mockResult);
      expect(prisma.overage.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: { billed: true },
      });
    });

    it('should handle database errors gracefully', async () => {
      (prisma.overage.update as jest.Mock).mockRejectedValue(
        new Error('Database error'),
      );
      await expect(service.markAsBilled('1')).rejects.toThrow('Database error');
    });
  });

  describe('getOverageSummary', () => {
    it('should return overage summary without date filters', async () => {
      const overages = [
        { amount: 100, billed: false, userId: 'u1' },
        { amount: 200, billed: true, userId: 'u2' },
        { amount: 50, billed: false, userId: 'u1' },
      ];
      (prisma.overage.findMany as jest.Mock).mockResolvedValue(overages);
      const result = await service.getOverageSummary();
      expect(result.totalOverages).toBe(350);
      expect(result.unbilledOverages).toBe(150);
      expect(result.billedOverages).toBe(200);
      expect(result.usersWithOverages).toBe(2);
      expect(result.overagePeriods).toBe(3);
    });

    it('should return overage summary with date filters', async () => {
      const overages = [
        { amount: 100, billed: false, userId: 'u1' },
        { amount: 200, billed: true, userId: 'u2' },
      ];
      const periodStart = new Date('2024-01-01');
      const periodEnd = new Date('2024-01-31');
      (prisma.overage.findMany as jest.Mock).mockResolvedValue(overages);
      const result = await service.getOverageSummary(periodStart, periodEnd);
      expect(result.totalOverages).toBe(300);
      expect(result.unbilledOverages).toBe(100);
      expect(result.billedOverages).toBe(200);
      expect(result.usersWithOverages).toBe(2);
      expect(result.overagePeriods).toBe(2);
      expect(prisma.overage.findMany).toHaveBeenCalledWith({
        where: {
          periodStart: { gte: periodStart },
          periodEnd: { lte: periodEnd },
        },
      });
    });

    it('should handle empty overages list', async () => {
      (prisma.overage.findMany as jest.Mock).mockResolvedValue([]);
      const result = await service.getOverageSummary();
      expect(result.totalOverages).toBe(0);
      expect(result.unbilledOverages).toBe(0);
      expect(result.billedOverages).toBe(0);
      expect(result.usersWithOverages).toBe(0);
      expect(result.overagePeriods).toBe(0);
    });

    it('should handle all billed overages', async () => {
      const overages = [
        { amount: 100, billed: true, userId: 'u1' },
        { amount: 200, billed: true, userId: 'u2' },
      ];
      (prisma.overage.findMany as jest.Mock).mockResolvedValue(overages);
      const result = await service.getOverageSummary();
      expect(result.totalOverages).toBe(300);
      expect(result.unbilledOverages).toBe(0);
      expect(result.billedOverages).toBe(300);
      expect(result.usersWithOverages).toBe(2);
      expect(result.overagePeriods).toBe(2);
    });

    it('should handle all unbilled overages', async () => {
      const overages = [
        { amount: 100, billed: false, userId: 'u1' },
        { amount: 200, billed: false, userId: 'u2' },
      ];
      (prisma.overage.findMany as jest.Mock).mockResolvedValue(overages);
      const result = await service.getOverageSummary();
      expect(result.totalOverages).toBe(300);
      expect(result.unbilledOverages).toBe(300);
      expect(result.billedOverages).toBe(0);
      expect(result.usersWithOverages).toBe(2);
      expect(result.overagePeriods).toBe(2);
    });
  });

  describe('getUnbilledOverages', () => {
    it('should return unbilled overages', async () => {
      const unbilled = [
        { id: '1', billed: false, amount: 100 },
        { id: '2', billed: false, amount: 200 },
      ];
      (prisma.overage.findMany as jest.Mock).mockResolvedValue(unbilled);
      const result = await service.getUnbilledOverages();
      expect(result).toEqual(unbilled);
      expect(prisma.overage.findMany).toHaveBeenCalledWith({
        where: { billed: false },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
        },
        orderBy: { periodStart: 'desc' },
      });
    });

    it('should return empty array when no unbilled overages', async () => {
      (prisma.overage.findMany as jest.Mock).mockResolvedValue([]);
      const result = await service.getUnbilledOverages();
      expect(result).toEqual([]);
    });
  });
});
