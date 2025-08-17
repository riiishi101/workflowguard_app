import { Test, TestingModule } from '@nestjs/testing';
import { WorkflowController } from './workflow.controller';
import { WorkflowService } from './workflow.service';

describe.skip('WorkflowController', () => {
  let controller: WorkflowController;
  let service: WorkflowService;

  const mockWorkflowService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findByHubspotId: jest.fn(),
    getHubSpotWorkflows: jest.fn(),
    getProtectedWorkflows: jest.fn(),
    getProtectedWorkflowIds: jest.fn(),
    syncHubSpotWorkflows: jest.fn(),
    createAutomatedBackup: jest.fn(),
    createChangeNotification: jest.fn(),
    createApprovalRequest: jest.fn(),
    generateComplianceReport: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    restoreWorkflowVersion: jest.fn(),
    rollbackWorkflow: jest.fn(),
    downloadWorkflowVersion: jest.fn(),
    startWorkflowProtection: jest.fn(),
    getWorkflowStats: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [WorkflowController],
      providers: [
        {
          provide: WorkflowService,
          useValue: mockWorkflowService,
        },
      ],
    }).compile();

    controller = module.get<WorkflowController>(WorkflowController);
    service = module.get<WorkflowService>(WorkflowService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should return an array of workflows', async () => {
      const result = [{ id: '1', name: 'Test Workflow' }];
      mockWorkflowService.findAll.mockResolvedValue(result);

      expect(await controller.findAll()).toBe(result);
      expect(mockWorkflowService.findAll).toHaveBeenCalled();
    });
  });

  describe('getHubSpotWorkflows', () => {
    it('should return workflows from HubSpot', async () => {
      const workflows = [{ id: 'hs1', name: 'HubSpot Workflow' }];
      const req = { user: { sub: 'userId' } } as any;
      mockWorkflowService.getHubSpotWorkflows.mockResolvedValue(workflows);

      const result = await controller.getHubSpotWorkflows(req);

      expect(result).toEqual({
        success: true,
        data: workflows,
        message: `Successfully fetched ${workflows.length} workflows from HubSpot`,
      });
      expect(mockWorkflowService.getHubSpotWorkflows).toHaveBeenCalledWith('userId');
    });
  });

  describe('findOne', () => {
    it('should return a single workflow', async () => {
      const workflow = { id: '1', name: 'Test Workflow' };
      const req = { user: { sub: 'userId' } } as any;
      mockWorkflowService.findOne.mockResolvedValue(workflow);

      const result = await controller.findOne('1', req);

      expect(result).toEqual({
        success: true,
        data: workflow,
        message: 'Workflow found successfully',
      });
      expect(mockWorkflowService.findOne).toHaveBeenCalledWith('1', 'userId');
    });
  });

  describe('findByHubspotId', () => {
    it('should return a workflow by hubspot id', async () => {
      const workflow = { id: '1', name: 'Test Workflow', hubspotId: 'hs1' };
      const req = { user: { sub: 'userId' } } as any;
      mockWorkflowService.findByHubspotId.mockResolvedValue(workflow);

      const result = await controller.findByHubspotId('hs1', req);

      expect(result).toEqual({
        success: true,
        data: workflow,
        message: 'Workflow found successfully',
      });
      expect(mockWorkflowService.findByHubspotId).toHaveBeenCalledWith('hs1', 'userId');
    });
  });

  describe('startWorkflowProtection', () => {
    it('should start protection for workflows', async () => {
      const body = { workflows: [{ id: 'hs1' }] };
      const req = { user: { sub: 'userId' } } as any;
      const protectedWorkflows = [{ id: '1', hubspotId: 'hs1' }];
      mockWorkflowService.startWorkflowProtection.mockResolvedValue(protectedWorkflows as any);

      const result = await controller.startWorkflowProtection(body as any, req);

      expect(result).toEqual({
        success: true,
        message: 'Workflow protection started successfully',
        data: protectedWorkflows,
      });
      expect(mockWorkflowService.startWorkflowProtection).toHaveBeenCalledWith(
        ['hs1'],
        'userId',
        body.workflows,
      );
    });
  });

  describe('syncHubSpotWorkflows', () => {
    it('should sync workflows from HubSpot', async () => {
      const req = { user: { sub: 'userId' } } as any;
      const syncedWorkflows = [{ id: '1', name: 'Synced Workflow' }];
      mockWorkflowService.syncHubSpotWorkflows.mockResolvedValue(syncedWorkflows as any);

      const result = await controller.syncHubSpotWorkflows(req);

      expect(result).toEqual({
        success: true,
        data: syncedWorkflows,
        message: `Successfully synced ${syncedWorkflows.length} workflows from HubSpot`,
      });
      expect(mockWorkflowService.syncHubSpotWorkflows).toHaveBeenCalledWith('userId');
    });
  });

  describe('getProtectedWorkflows', () => {
    it('should return protected workflows', async () => {
      const req = { user: { sub: 'userId' } } as any;
      const protectedWorkflows = [{ id: '1', name: 'Protected Workflow' }];
      mockWorkflowService.getProtectedWorkflows.mockResolvedValue(protectedWorkflows as any);

      const result = await controller.getProtectedWorkflows(req);

      expect(result).toEqual({
        success: true,
        data: protectedWorkflows,
        message: `Successfully fetched ${protectedWorkflows.length} protected workflows`,
      });
      expect(mockWorkflowService.getProtectedWorkflows).toHaveBeenCalledWith('userId');
    });
  });

  describe('getWorkflowStats', () => {
    it('should return workflow stats', async () => {
      const req = { user: { sub: 'userId' } } as any;
      const stats = [{ total: 10, protected: 5 }];
      mockWorkflowService.getWorkflowStats.mockResolvedValue(stats as any);

      const result = await controller.getWorkflowStats(req);

      expect(result).toEqual(stats);
      expect(mockWorkflowService.getWorkflowStats).toHaveBeenCalledWith('userId');
    });
  });

  describe('create', () => {
    it('should create a workflow', async () => {
      const dto = { name: 'New Workflow' };
      const result = { id: '1', ...dto };
      mockWorkflowService.create.mockResolvedValue(result);

      expect(await controller.create(dto as any)).toBe(result);
      expect(mockWorkflowService.create).toHaveBeenCalledWith(dto);
    });
  });

  describe('update', () => {
    it('should update a workflow', async () => {
      const dto = { name: 'Updated Workflow' };
      const result = { id: '1', ...dto };
      mockWorkflowService.update.mockResolvedValue(result);

      expect(await controller.update('1', dto)).toBe(result);
      expect(mockWorkflowService.update).toHaveBeenCalledWith('1', dto);
    });
  });

  describe('remove', () => {
    it('should remove a workflow', async () => {
      const result = { id: '1' };
      mockWorkflowService.remove.mockResolvedValue(result);

      expect(await controller.remove('1')).toBe(result);
      expect(mockWorkflowService.remove).toHaveBeenCalledWith('1');
    });
  });

  describe('Delegated Methods', () => {
    const req = { user: { sub: 'userId' } } as any;
    const workflowId = 'workflowId';
    const versionId = 'versionId';

    it('should call restoreWorkflowVersion', async () => {
      await controller.restoreWorkflowVersion(workflowId, versionId, req);
      expect(mockWorkflowService.restoreWorkflowVersion).toHaveBeenCalledWith(workflowId, versionId, 'userId');
    });

    it('should call rollbackWorkflow', async () => {
      await controller.rollbackWorkflow(workflowId, req);
      expect(mockWorkflowService.rollbackWorkflow).toHaveBeenCalledWith(workflowId, 'userId');
    });

    it('should call downloadWorkflowVersion', async () => {
      await controller.downloadWorkflowVersion(workflowId, versionId);
      expect(mockWorkflowService.downloadWorkflowVersion).toHaveBeenCalledWith(workflowId, versionId);
    });
  });
});

