import { Test, TestingModule } from '@nestjs/testing';
import { WorkflowService } from './workflow.service';
import { PrismaService } from '../prisma/prisma.service';
import { HubSpotService } from '../services/hubspot.service';
import { WorkflowVersionService } from '../workflow-version/workflow-version.service';
import { HttpException, HttpStatus } from '@nestjs/common';

describe('WorkflowService', () => {
  let service: WorkflowService;
  let prisma: PrismaService;
  let hubspotService: HubSpotService;
  let workflowVersionService: WorkflowVersionService;

  const mockPrismaService = {
    workflow: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    auditLog: {
      count: jest.fn(),
    },
  };

  const mockHubSpotService = {
    getWorkflows: jest.fn(),
  };

  const mockWorkflowVersionService = {
    createInitialVersion: jest.fn(),
    createAutomatedBackup: jest.fn(),
    createChangeNotification: jest.fn(),
    createApprovalWorkflow: jest.fn(),
    generateComplianceReport: jest.fn(),
    restoreWorkflowVersion: jest.fn(),
    rollbackWorkflow: jest.fn(),
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WorkflowService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: HubSpotService, useValue: mockHubSpotService },
        {
          provide: WorkflowVersionService,
          useValue: mockWorkflowVersionService,
        },
      ],
    }).compile();

    service = module.get<WorkflowService>(WorkflowService);
    prisma = module.get<PrismaService>(PrismaService);
    hubspotService = module.get<HubSpotService>(HubSpotService);
    workflowVersionService = module.get<WorkflowVersionService>(
      WorkflowVersionService,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getHubSpotWorkflows', () => {
    it('should return an array of HubSpot workflows', async () => {
      const userId = 'test-user-id';
      const expectedWorkflows = [{ id: '1', name: 'Test Workflow' }];
      mockHubSpotService.getWorkflows.mockResolvedValue(expectedWorkflows);

      const result = await service.getHubSpotWorkflows(userId);

      expect(result).toEqual(expectedWorkflows);
      expect(mockHubSpotService.getWorkflows).toHaveBeenCalledWith(userId);
    });

    it('should throw an HttpException if HubSpot service fails', async () => {
      const userId = 'test-user-id';
      const errorMessage = 'HubSpot API error';
      mockHubSpotService.getWorkflows.mockRejectedValue(new Error(errorMessage));

      await expect(service.getHubSpotWorkflows(userId)).rejects.toThrow(
        new HttpException(
          `Failed to get HubSpot workflows: ${errorMessage}`,
          HttpStatus.INTERNAL_SERVER_ERROR,
        ),
      );
    });
  });

  describe('create', () => {
    it('should create and return a workflow', async () => {
      const createWorkflowDto = { name: 'New Workflow', ownerId: 'user1' };
      const expectedWorkflow = {
        id: '1',
        ...createWorkflowDto,
        createdAt: new Date(),
        updatedAt: new Date(),
        hubspotId: null,
        isProtected: false,
      };
      mockPrismaService.workflow.create.mockResolvedValue(expectedWorkflow);

      const result = await service.create(createWorkflowDto as any);

      expect(result).toEqual(expectedWorkflow);
      expect(mockPrismaService.workflow.create).toHaveBeenCalledWith({
        data: createWorkflowDto,
      });
    });
  });

  describe('findAll', () => {
    it('should return an array of workflows', async () => {
      const expectedWorkflows = [{ id: '1', name: 'Test Workflow' }];
      mockPrismaService.workflow.findMany.mockResolvedValue(expectedWorkflows as any);

      const result = await service.findAll();

      expect(result).toEqual(expectedWorkflows);
      expect(mockPrismaService.workflow.findMany).toHaveBeenCalledWith({
        include: {
          owner: true,
          versions: true,
        },
      });
    });
  });

  describe('findOne', () => {
    const workflowId = 'workflow-id';
    const userId = 'user-id';
    const now = new Date();
    const mockWorkflow = {
      id: workflowId,
      ownerId: userId,
      name: 'Test Workflow',
      updatedAt: now,
      versions: [{ id: 'v1', createdAt: now }],
    };

    it('should return workflow details if found', async () => {
      mockPrismaService.workflow.findFirst.mockResolvedValue(mockWorkflow as any);

      const result = await service.findOne(workflowId, userId);

      expect(result).toBeDefined();
      expect(result.id).toEqual(workflowId);
      expect(result.lastModified).toEqual(now);
      expect(mockPrismaService.workflow.findFirst).toHaveBeenCalledWith({
        where: { id: workflowId, ownerId: userId },
        include: {
          owner: true,
          versions: {
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
      });
    });

    it('should throw HttpException if workflow not found', async () => {
      mockPrismaService.workflow.findFirst.mockResolvedValue(null);

      await expect(service.findOne(workflowId, userId)).rejects.toThrow(
        new HttpException('Workflow not found', HttpStatus.NOT_FOUND),
      );
    });
  });

  describe('findByHubspotId', () => {
    const hubspotId = 'hubspot-workflow-id';
    const userId = 'user-id';
    const mockUser = { id: userId, name: 'Test User', email: 'test@test.com' };
    const mockWorkflow = {
      id: 'workflow-id',
      hubspotId: hubspotId,
      ownerId: userId,
      name: 'Test Workflow',
      updatedAt: new Date(),
      versions: [],
    };

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should return workflow from DB if it exists', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser as any);
      mockPrismaService.workflow.findFirst.mockResolvedValue(mockWorkflow as any);

      const result = await service.findByHubspotId(hubspotId, userId);

      expect(result.id).toEqual(mockWorkflow.id);
      expect(mockPrismaService.workflow.findFirst).toHaveBeenCalledWith({
        where: { hubspotId, ownerId: userId },
        include: {
          owner: true,
          versions: { orderBy: { createdAt: 'desc' } },
        },
      });
      expect(mockHubSpotService.getWorkflows).not.toHaveBeenCalled();
    });

    it('should fetch from HubSpot, create and return workflow if not in DB', async () => {
      const hubspotWorkflow = { id: hubspotId, name: 'HubSpot Workflow' };
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser as any);
      mockPrismaService.workflow.findFirst.mockResolvedValue(null);
      mockHubSpotService.getWorkflows.mockResolvedValue([hubspotWorkflow] as any);
      mockPrismaService.workflow.create.mockResolvedValue({ ...mockWorkflow, name: hubspotWorkflow.name } as any);

      const result = await service.findByHubspotId(hubspotId, userId);

      expect(result.name).toEqual(hubspotWorkflow.name);
      expect(mockHubSpotService.getWorkflows).toHaveBeenCalledWith(userId);
      expect(mockPrismaService.workflow.create).toHaveBeenCalledWith({
        data: {
          hubspotId: hubspotId,
          name: hubspotWorkflow.name,
          ownerId: userId,
        },
        include: {
          owner: true,
          versions: true,
        },
      });
    });

    it('should return a default structure if workflow not in DB or HubSpot', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser as any);
      mockPrismaService.workflow.findFirst.mockResolvedValue(null);
      mockHubSpotService.getWorkflows.mockResolvedValue([]);

      const result = await service.findByHubspotId(hubspotId, userId);

      expect(result.name).toEqual('Unknown Workflow');
      expect(result.hubspotId).toEqual(hubspotId);
    });

    it('should throw HttpException if user not found', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.findByHubspotId(hubspotId, userId)).rejects.toThrow(
        new HttpException('User not found', HttpStatus.NOT_FOUND),
      );
    });
  });

  describe('update', () => {
    it('should update and return a workflow', async () => {
      const workflowId = '1';
      const updateWorkflowDto = { name: 'Updated Workflow' };
      const expectedWorkflow = { id: workflowId, name: 'Updated Workflow' };
      mockPrismaService.workflow.update.mockResolvedValue(expectedWorkflow as any);

      const result = await service.update(workflowId, updateWorkflowDto as any);

      expect(result).toEqual(expectedWorkflow);
      expect(mockPrismaService.workflow.update).toHaveBeenCalledWith({
        where: { id: workflowId },
        data: updateWorkflowDto,
      });
    });
  });

  describe('remove', () => {
    it('should delete and return a workflow', async () => {
      const workflowId = '1';
      const expectedWorkflow = { id: workflowId, name: 'Test Workflow' };
      mockPrismaService.workflow.delete.mockResolvedValue(expectedWorkflow as any);

      const result = await service.remove(workflowId);

      expect(result).toEqual(expectedWorkflow);
      expect(mockPrismaService.workflow.delete).toHaveBeenCalledWith({
        where: { id: workflowId },
      });
    });
  });

  describe('startWorkflowProtection', () => {
    const userId = 'user-id';
    const workflowId = 'workflow-id';
    const hubspotId = 'hubspot-id';
    const selectedWorkflows = [{ id: workflowId, hubspotId: hubspotId, name: 'Test Workflow' }];
    const mockUser = { id: userId, email: 'test@example.com', name: 'Test User' };
    const mockWorkflow = { id: 'db-workflow-id', hubspotId: hubspotId, versions: [] };

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should protect a workflow, creating user and workflow if they do not exist', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);
      mockPrismaService.user.create.mockResolvedValue(mockUser as any);
      mockPrismaService.workflow.findFirst.mockResolvedValue(null);
      mockPrismaService.workflow.create.mockResolvedValue({ ...mockWorkflow, versions: [] } as any);
      mockHubSpotService.getWorkflows.mockResolvedValue([{ id: hubspotId, name: 'Test Workflow' }] as any);
      mockWorkflowVersionService.createInitialVersion.mockResolvedValue({ id: 'v1' } as any);

      const result = await service.startWorkflowProtection([workflowId], userId, selectedWorkflows as any);

      expect(mockPrismaService.user.create).toHaveBeenCalled();
      expect(mockPrismaService.workflow.create).toHaveBeenCalled();
      expect(mockWorkflowVersionService.createInitialVersion).toHaveBeenCalled();
      expect(result.length).toBe(1);
    });

    it('should protect a workflow for an existing user and workflow', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser as any);
      mockPrismaService.workflow.findFirst.mockResolvedValue({ ...mockWorkflow, versions: [{ id: 'v1' }] } as any);
      mockPrismaService.workflow.update.mockResolvedValue({ ...mockWorkflow, versions: [{ id: 'v1' }] } as any);

      const result = await service.startWorkflowProtection([workflowId], userId, selectedWorkflows as any);

      expect(mockPrismaService.user.create).not.toHaveBeenCalled();
      expect(mockPrismaService.workflow.update).toHaveBeenCalled();
      expect(mockWorkflowVersionService.createInitialVersion).not.toHaveBeenCalled();
      expect(result.length).toBe(1);
    });

    it('should create initial version if workflow exists but has no versions', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser as any);
      mockPrismaService.workflow.findFirst.mockResolvedValue(mockWorkflow as any);
      mockPrismaService.workflow.update.mockResolvedValue(mockWorkflow as any);
      mockHubSpotService.getWorkflows.mockResolvedValue([{ id: hubspotId, name: 'Test Workflow' }] as any);
      mockWorkflowVersionService.createInitialVersion.mockResolvedValue({ id: 'v1' } as any);

      await service.startWorkflowProtection([workflowId], userId, selectedWorkflows as any);

      expect(mockWorkflowVersionService.createInitialVersion).toHaveBeenCalled();
    });
  });

  describe('getProtectedWorkflows', () => {
    const userId = 'user-id';
    const mockWorkflows = [
      {
        id: 'w1',
        hubspotId: 'hs1',
        name: 'Workflow 1',
        ownerId: userId,
        updatedAt: new Date(),
        versions: [{ id: 'v1' }],
        owner: { name: 'Test User', email: 'test@test.com' },
      },
    ];

    it('should return transformed protected workflows', async () => {
      mockPrismaService.workflow.findMany.mockResolvedValue(mockWorkflows as any);

      const result = await service.getProtectedWorkflows(userId);

      expect(result.length).toBe(1);
      expect(result[0].id).toBe('hs1');
      expect(result[0].protectionStatus).toBe('protected');
    });

    it('should return an empty array if no user ID is provided', async () => {
      const result = await service.getProtectedWorkflows(null as any);
      expect(result).toEqual([]);
    });

    it('should return an empty array if an error occurs', async () => {
      mockPrismaService.workflow.findMany.mockRejectedValue(new Error('DB error'));
      const result = await service.getProtectedWorkflows(userId);
      expect(result).toEqual([]);
    });
  });

  describe('getProtectedWorkflowIds', () => {
    const userId = 'user-id';
    const mockWorkflows = [
      {
        id: 'w1',
        hubspotId: 'hs1',
        name: 'Workflow 1',
      },
      {
        id: 'w2',
        hubspotId: 'hs2',
        name: 'Workflow 2',
      },
    ];

    it('should return an array of protected workflow HubSpot IDs', async () => {
      // This is a bit of a trick since getProtectedWorkflows is mocked via prisma, not by calling the actual method
      mockPrismaService.workflow.findMany.mockResolvedValue(mockWorkflows as any);

      const result = await service.getProtectedWorkflowIds(userId);

      expect(result).toEqual(['hs1', 'hs2']);
    });
  });

  describe('syncHubSpotWorkflows', () => {
    const userId = 'user-id';
    const hubspotWorkflows = [
      { id: 'hs1', name: 'Workflow 1' },
      { id: 'hs2', name: 'Workflow 2 Updated' },
    ];
    const existingWorkflow = { id: 'db-id-2', hubspotId: 'hs2', name: 'Workflow 2' };

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should sync workflows from HubSpot, creating new and updating existing', async () => {
      mockHubSpotService.getWorkflows.mockResolvedValue(hubspotWorkflows as any);
      // hs1 is new, hs2 exists
      mockPrismaService.workflow.findFirst
        .mockResolvedValueOnce(null) // for hs1
        .mockResolvedValueOnce(existingWorkflow as any); // for hs2

      mockPrismaService.workflow.create.mockResolvedValue({} as any);
      mockPrismaService.workflow.update.mockResolvedValue({} as any);

      await service.syncHubSpotWorkflows(userId);

      expect(mockHubSpotService.getWorkflows).toHaveBeenCalledWith(userId);
      expect(mockPrismaService.workflow.create).toHaveBeenCalledWith({
        data: {
          hubspotId: 'hs1',
          name: 'Workflow 1',
          ownerId: userId,
        },
        include: { owner: true, versions: true },
      });
      expect(mockPrismaService.workflow.update).toHaveBeenCalledWith({
        where: { id: existingWorkflow.id },
        data: {
          name: 'Workflow 2 Updated',
          updatedAt: expect.any(Date),
        },
        include: { owner: true, versions: true },
      });
    });

    it('should throw an HttpException on failure', async () => {
      mockHubSpotService.getWorkflows.mockRejectedValue(new Error('API Error'));

      await expect(service.syncHubSpotWorkflows(userId)).rejects.toThrow(
        new HttpException(
          'Failed to sync HubSpot workflows: API Error',
          HttpStatus.INTERNAL_SERVER_ERROR,
        ),
      );
    });
  });

  describe('WorkflowVersionService Delegating Methods', () => {
    const workflowId = 'workflow-id';
    const userId = 'user-id';
    const versionId = 'version-id';

    it('createAutomatedBackup should call workflowVersionService', async () => {
      await service.createAutomatedBackup(workflowId, userId);
      expect(
        mockWorkflowVersionService.createAutomatedBackup,
      ).toHaveBeenCalledWith(workflowId, userId);
    });

    it('createChangeNotification should call workflowVersionService', async () => {
      const changes = { data: 'changes' };
      await service.createChangeNotification(workflowId, userId, changes);
      expect(
        mockWorkflowVersionService.createChangeNotification,
      ).toHaveBeenCalledWith(workflowId, userId, changes);
    });

    it('createApprovalRequest should call workflowVersionService', async () => {
      const changes = { data: 'changes' };
      await service.createApprovalRequest(workflowId, userId, changes);
      expect(
        mockWorkflowVersionService.createApprovalWorkflow,
      ).toHaveBeenCalledWith(workflowId, userId, changes);
    });

    it('generateComplianceReport should call workflowVersionService', async () => {
      const startDate = new Date();
      const endDate = new Date();
      await service.generateComplianceReport(workflowId, startDate, endDate);
      expect(
        mockWorkflowVersionService.generateComplianceReport,
      ).toHaveBeenCalledWith(workflowId, startDate, endDate);
    });

    it('restoreWorkflowVersion should call workflowVersionService', async () => {
      await service.restoreWorkflowVersion(workflowId, versionId, userId);
      expect(
        mockWorkflowVersionService.restoreWorkflowVersion,
      ).toHaveBeenCalledWith(workflowId, versionId, userId);
    });

    it('rollbackWorkflow should call workflowVersionService', async () => {
      await service.rollbackWorkflow(workflowId, userId);
      expect(mockWorkflowVersionService.rollbackWorkflow).toHaveBeenCalledWith(
        workflowId,
        userId,
      );
    });

    it('downloadWorkflowVersion should call workflowVersionService.findOne', async () => {
      await service.downloadWorkflowVersion(workflowId, versionId);
      expect(mockWorkflowVersionService.findOne).toHaveBeenCalledWith(versionId);
    });

    it('should throw HttpException on method failure', async () => {
      const errorMessage = 'Service Error';
      mockWorkflowVersionService.createAutomatedBackup.mockRejectedValue(
        new Error(errorMessage),
      );

      await expect(
        service.createAutomatedBackup(workflowId, userId),
      ).rejects.toThrow(
        new HttpException(
          `Failed to create automated backup: ${errorMessage}`,
          HttpStatus.INTERNAL_SERVER_ERROR,
        ),
      );
    });
  });
});
