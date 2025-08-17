import { Test, TestingModule } from '@nestjs/testing';
import { WorkflowVersionController } from './workflow-version.controller';
import { WorkflowVersionService } from './workflow-version.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { HttpException, HttpStatus } from '@nestjs/common';
import { RequestWithUser } from '../types/request-with-user.interface';
import { UpdateWorkflowVersionDto, WorkflowVersionHistoryDto } from './dto';

describe('WorkflowVersionController', () => {
  let controller: WorkflowVersionController;
  let service: jest.Mocked<WorkflowVersionService>;

  const mockWorkflowVersionService = {
    findByWorkflowIdWithHistoryLimit: jest.fn(),
    findByHubspotIdWithHistory: jest.fn(),
    update: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [WorkflowVersionController],
      providers: [
        {
          provide: WorkflowVersionService,
          useValue: mockWorkflowVersionService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<WorkflowVersionController>(WorkflowVersionController);
    service = module.get(WorkflowVersionService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getWorkflowHistory', () => {
    it('should return workflow history', async () => {
      const req = { user: { sub: 'user-id' } } as RequestWithUser;
      const result: WorkflowVersionHistoryDto[] = [{
        id: '1',
        workflowId: 'workflow-id',
        versionNumber: 1,
        date: new Date().toISOString(),
        type: 'Initial',
        initiator: 'test-user',
        notes: 'Initial version',
        changes: { added: 0, modified: 0, removed: 0 },
        status: 'active',
        selected: false,
      }];
      service.findByWorkflowIdWithHistoryLimit.mockResolvedValue(result);

      expect(
        await controller.getWorkflowHistory('workflow-id', req),
      ).toBe(result);
      expect(service.findByWorkflowIdWithHistoryLimit).toHaveBeenCalledWith(
        'workflow-id',
        50,
      );
    });
  });

  describe('getWorkflowHistoryByHubspotId', () => {
    it('should return workflow history for a HubSpot ID', async () => {
      const req = { user: { sub: 'user-id' } } as RequestWithUser;
      const mockHistoryData = [{
        id: '1',
        versionNumber: 1,
        snapshotType: 'Initial',
        createdBy: 'user-1',
        createdAt: new Date(),
        data: {},
        workflowId: 'workflow-1',
        changes: { added: 0, modified: 0, removed: 0 },
        changeSummary: 'No changes'
      }];
      const expectedResult = { 
        success: true, 
        data: mockHistoryData, 
        message: 'Workflow history retrieved successfully' 
      };
      service.findByHubspotIdWithHistory.mockResolvedValue(mockHistoryData);

      const response = await controller.getWorkflowHistoryByHubspotId(
        'hubspot-id',
        req,
      );

      expect(response).toEqual(expectedResult);
      expect(service.findByHubspotIdWithHistory).toHaveBeenCalledWith(
        'hubspot-id',
        'user-id',
      );
    });
  });

  describe('update', () => {
    it('should update a workflow version', async () => {
      const dto: UpdateWorkflowVersionDto = { data: { key: 'value' } };
      const result = {
        id: '1',
        ...dto,
        workflowId: 'workflow-1',
        versionNumber: 1,
        snapshotType: 'Update',
        createdBy: 'user-1',
        createdAt: new Date(),
        data: { key: 'value' }
      };
      service.update.mockResolvedValue(result);

      expect(await controller.update('1', dto)).toBe(result);
      expect(service.update).toHaveBeenCalledWith('1', dto);
    });
  });
});
