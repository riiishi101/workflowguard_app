import { Test, TestingModule } from '@nestjs/testing';
import { WorkflowVersionService } from './workflow-version.service';
import { PrismaService } from '../prisma/prisma.service';
import { HttpException, HttpStatus } from '@nestjs/common';

describe('WorkflowVersionService', () => {
  let service: WorkflowVersionService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    workflowVersion: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    auditLog: {
      create: jest.fn(),
    },
    workflow: {
      findUnique: jest.fn(),
    },
    approvalRequest: {
      create: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WorkflowVersionService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<WorkflowVersionService>(WorkflowVersionService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const mockVersionData = {
      workflowId: 'test-workflow-id',
      versionNumber: 1,
      snapshotType: 'Initial',
      data: { test: 'data' },
      createdBy: 'test-user',
    };

    it('should create a new workflow version', async () => {
      mockPrismaService.workflowVersion.create.mockResolvedValue(
        mockVersionData,
      );

      const result = await service.create(mockVersionData);

      expect(result).toEqual(mockVersionData);
      expect(mockPrismaService.workflowVersion.create).toHaveBeenCalledWith({
        data: mockVersionData,
      });
    });
  });

  describe('findByWorkflowIdWithHistoryLimit', () => {
    const mockWorkflowId = 'test-workflow-id';
    const mockUserId = '1';
    const mockVersions = [
      {
        id: '1',
        workflowId: mockWorkflowId,
        versionNumber: 1,
        data: { test: 'data1' },
        createdAt: new Date(),
      },
      {
        id: '2',
        workflowId: mockWorkflowId,
        versionNumber: 2,
        data: { test: 'data2' },
        createdAt: new Date(),
      },
    ];

    it('should return transformed workflow versions with history limit', async () => {
      mockPrismaService.workflowVersion.findMany.mockResolvedValue(
        mockVersions,
      );

      const result = await service.findByWorkflowIdWithHistoryLimit(
        mockWorkflowId,
        50,
      );

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBeTruthy();
      expect(mockPrismaService.workflowVersion.findMany).toHaveBeenCalledWith({
        where: { workflowId: mockWorkflowId },
        include: { workflow: true },
        orderBy: { versionNumber: 'desc' },
        take: 50,
      });
    });

    it('should return empty array when no versions found', async () => {
      mockPrismaService.workflowVersion.findMany.mockResolvedValue([]);

      const result = await service.findByWorkflowIdWithHistoryLimit(
        mockWorkflowId,
        50,
      );

      expect(result).toEqual([]);
    });

    it('should handle errors gracefully', async () => {
      mockPrismaService.workflowVersion.findMany.mockRejectedValue(
        new Error('Database error'),
      );

      await expect(
        service.findByWorkflowIdWithHistoryLimit(mockWorkflowId, 50),
      ).rejects.toThrow(HttpException);
    });
  });

  describe('restoreWorkflowVersion', () => {
    const mockWorkflowId = 'test-workflow-id';
    const mockVersionId = 'test-version-id';
    const mockUserId = 'test-user-id';
    const mockVersion = {
      id: mockVersionId,
      workflowId: mockWorkflowId,
      versionNumber: 1,
      data: { test: 'data' },
    };

    it('should restore a workflow version successfully', async () => {
      mockPrismaService.workflowVersion.findUnique.mockResolvedValue(
        mockVersion,
      );
      mockPrismaService.workflowVersion.findFirst.mockResolvedValue({
        versionNumber: 2,
      });
      mockPrismaService.workflowVersion.create.mockResolvedValue({
        ...mockVersion,
        versionNumber: 3,
      });

      const result = await service.restoreWorkflowVersion(
        mockWorkflowId,
        mockVersionId,
        mockUserId,
      );

      expect(result).toBeDefined();
      expect(result.message).toBe('Workflow restored successfully');
      expect(result.restoredVersion).toBeDefined();
    });

    it('should throw error when version not found', async () => {
      mockPrismaService.workflowVersion.findUnique.mockResolvedValue(null);

      await expect(
        service.restoreWorkflowVersion(
          mockWorkflowId,
          mockVersionId,
          mockUserId as any,
        ),
      ).rejects.toThrow(HttpException);
    });
  });

  describe('createInitialVersion', () => {
    const mockUserId = 'test-user-id';
    const mockWorkflow = {
      id: 'test-workflow-id',
      hubspotId: 'test-hubspot-id',
      name: 'Test Workflow',
      createdAt: new Date(),
      updatedAt: new Date(),
      ownerId: mockUserId,
      isProtected: true,
    };
    const mockInitialData = {
      hubspotId: mockWorkflow.hubspotId,
      name: mockWorkflow.name,
      status: 'active',
    };

    it('should create initial version successfully', async () => {
      mockPrismaService.workflowVersion.findFirst.mockResolvedValue(null);
      mockPrismaService.workflowVersion.create.mockResolvedValue({
        ...mockInitialData,
        id: 'new-version-id',
        workflowId: mockWorkflow.id,
        versionNumber: 1,
        createdAt: new Date(),
        snapshotType: 'Initial Protection',
        createdBy: mockUserId,
        data: mockInitialData,
      });

      const result = await service.createInitialVersion(
        mockWorkflow,
        mockUserId,
        mockInitialData,
      );

      expect(result).toBeDefined();
      expect(mockPrismaService.workflowVersion.create).toHaveBeenCalled();
      expect(mockPrismaService.auditLog.create).toHaveBeenCalled();
    });

    it('should handle errors during initial version creation', async () => {
      mockPrismaService.workflowVersion.create.mockRejectedValue(
        new Error('Creation failed'),
      );

      await expect(
        service.createInitialVersion(mockWorkflow, mockUserId as any, mockInitialData),
      ).rejects.toThrow();
    });
  });
});
