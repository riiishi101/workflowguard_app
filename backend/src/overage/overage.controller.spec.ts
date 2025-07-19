import { Test, TestingModule } from '@nestjs/testing';
import { OverageController } from './overage.controller';
import { OverageService } from './overage.service';
import { HubSpotBillingService } from '../services/hubspot-billing.service';
import { HttpException } from '@nestjs/common';

describe('OverageController', () => {
  let controller: OverageController;
  let overageService: OverageService;
  let hubspotBillingService: HubSpotBillingService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OverageController],
      providers: [
        {
          provide: OverageService,
          useValue: {
            findAll: jest.fn(),
            findOne: jest.fn(),
            markAsBilled: jest.fn(),
            getOverageSummary: jest.fn(),
            getUnbilledOverages: jest.fn(),
          },
        },
        {
          provide: HubSpotBillingService,
          useValue: {
            reportOveragesToHubSpot: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<OverageController>(OverageController);
    overageService = module.get<OverageService>(OverageService);
    hubspotBillingService = module.get<HubSpotBillingService>(
      HubSpotBillingService,
    );
  });

  describe('findAll', () => {
    it('should return all overages without filters', async () => {
      const mockOverages = [{ id: '1', amount: 100 }];
      (overageService.findAll as jest.Mock).mockResolvedValue(mockOverages);
      const result = await controller.findAll();
      expect(result).toEqual(mockOverages);
      expect(overageService.findAll).toHaveBeenCalledWith({});
    });

    it('should return overages with userId filter', async () => {
      const mockOverages = [{ id: '1', amount: 100, userId: 'user1' }];
      (overageService.findAll as jest.Mock).mockResolvedValue(mockOverages);
      const result = await controller.findAll('user1');
      expect(result).toEqual(mockOverages);
      expect(overageService.findAll).toHaveBeenCalledWith({ userId: 'user1' });
    });

    it('should return overages with billed filter', async () => {
      const mockOverages = [{ id: '1', amount: 100, billed: true }];
      (overageService.findAll as jest.Mock).mockResolvedValue(mockOverages);
      const result = await controller.findAll(undefined, 'true');
      expect(result).toEqual(mockOverages);
      expect(overageService.findAll).toHaveBeenCalledWith({ billed: true });
    });

    it('should return overages with period filters', async () => {
      const mockOverages = [{ id: '1', amount: 100 }];
      (overageService.findAll as jest.Mock).mockResolvedValue(mockOverages);
      const result = await controller.findAll(
        undefined,
        undefined,
        '2024-01-01',
        '2024-01-31',
      );
      expect(result).toEqual(mockOverages);
      expect(overageService.findAll).toHaveBeenCalledWith({
        periodStart: { gte: new Date('2024-01-01') },
        periodEnd: { lte: new Date('2024-01-31') },
      });
    });
  });

  describe('findOne', () => {
    it('should return a single overage', async () => {
      const mockOverage = { id: '1', amount: 100 };
      (overageService.findOne as jest.Mock).mockResolvedValue(mockOverage);
      const result = await controller.findOne('1');
      expect(result).toEqual(mockOverage);
    });

    it('should throw HttpException when overage not found', async () => {
      (overageService.findOne as jest.Mock).mockResolvedValue(null);
      await expect(controller.findOne('999')).rejects.toThrow(HttpException);
      await expect(controller.findOne('999')).rejects.toThrow(
        'Overage not found',
      );
    });
  });

  describe('markAsBilled', () => {
    it('should mark overage as billed', async () => {
      const mockResult = { id: '1', billed: true };
      (overageService.markAsBilled as jest.Mock).mockResolvedValue(mockResult);
      const result = await controller.markAsBilled('1');
      expect(result).toEqual(mockResult);
    });
  });

  describe('bulkBillOverages', () => {
    it('should successfully bulk bill overages', async () => {
      const mockResults = [
        { overageId: '1', success: true, hubspotReference: 'ref1' },
        { overageId: '2', success: true, hubspotReference: 'ref2' },
      ];
      (
        hubspotBillingService.reportOveragesToHubSpot as jest.Mock
      ).mockResolvedValue(mockResults);

      const result = await controller.bulkBillOverages({
        overageIds: ['1', '2'],
      });

      expect(result).toEqual({
        message: 'Bulk billing completed',
        processed: 2,
        successful: 2,
        failed: 0,
        results: mockResults,
      });
    });

    it('should handle bulk billing failures', async () => {
      const mockResults = [
        { overageId: '1', success: true, hubspotReference: 'ref1' },
        { overageId: '2', success: false, error: 'HubSpot error' },
      ];
      (
        hubspotBillingService.reportOveragesToHubSpot as jest.Mock
      ).mockResolvedValue(mockResults);

      const result = await controller.bulkBillOverages({
        overageIds: ['1', '2'],
      });

      expect(result).toEqual({
        message: 'Bulk billing completed',
        processed: 2,
        successful: 1,
        failed: 1,
        results: mockResults,
      });
    });

    it('should throw HttpException when bulk billing fails', async () => {
      (
        hubspotBillingService.reportOveragesToHubSpot as jest.Mock
      ).mockRejectedValue(new Error('HubSpot API error'));

      await expect(
        controller.bulkBillOverages({ overageIds: ['1'] }),
      ).rejects.toThrow(HttpException);
      await expect(
        controller.bulkBillOverages({ overageIds: ['1'] }),
      ).rejects.toThrow('Bulk billing failed: HubSpot API error');
    });
  });

  describe('getBillingStatus', () => {
    it('should return operational status when no errors', async () => {
      const mockUnbilledOverages = [
        { id: '1', amount: 100 },
        { id: '2', amount: 200 },
      ];
      (overageService.getUnbilledOverages as jest.Mock).mockResolvedValue(
        mockUnbilledOverages,
      );

      const result = await controller.getBillingStatus();

      expect(result).toEqual({
        status: 'operational',
        unbilledCount: 2,
        totalUnbilledAmount: 300,
        lastChecked: expect.any(String),
        message: 'Billing system is operational',
      });
    });

    it('should return error status when exception occurs', async () => {
      (overageService.getUnbilledOverages as jest.Mock).mockRejectedValue(
        new Error('Database connection failed'),
      );

      const result = await controller.getBillingStatus();

      expect(result).toEqual({
        status: 'error',
        error: 'Database connection failed',
        lastChecked: expect.any(String),
        message: 'Billing system encountered an error',
      });
    });
  });

  describe('getOverageSummary', () => {
    it('should return overage summary without date filters', async () => {
      const summary = { totalOverages: 100, unbilledOverages: 20 };
      (overageService.getOverageSummary as jest.Mock).mockResolvedValue(
        summary,
      );
      const result = await controller.getOverageSummary();
      expect(result).toEqual(summary);
      expect(overageService.getOverageSummary).toHaveBeenCalledWith(
        undefined,
        undefined,
      );
    });

    it('should return overage summary with date filters', async () => {
      const summary = { totalOverages: 50, unbilledOverages: 10 };
      (overageService.getOverageSummary as jest.Mock).mockResolvedValue(
        summary,
      );
      const result = await controller.getOverageSummary(
        '2024-01-01',
        '2024-01-31',
      );
      expect(result).toEqual(summary);
      expect(overageService.getOverageSummary).toHaveBeenCalledWith(
        new Date('2024-01-01'),
        new Date('2024-01-31'),
      );
    });
  });

  describe('getUnbilledOverages', () => {
    it('should return unbilled overages', async () => {
      const unbilled = [{ id: '2', billed: false }];
      (overageService.getUnbilledOverages as jest.Mock).mockResolvedValue(
        unbilled,
      );
      const result = await controller.getUnbilledOverages();
      expect(result).toEqual(unbilled);
    });
  });
});
