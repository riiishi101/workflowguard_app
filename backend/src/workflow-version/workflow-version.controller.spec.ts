import { Test, TestingModule } from '@nestjs/testing';
import { WorkflowVersionController } from './workflow-version.controller';
import { WorkflowVersionService } from './workflow-version.service';

describe('WorkflowVersionController', () => {
  let controller: WorkflowVersionController;
  let workflowVersionService: any;

  beforeEach(async () => {
    workflowVersionService = { findAll: jest.fn(), findByWorkflowId: jest.fn(), findOne: jest.fn(), create: jest.fn(), update: jest.fn(), remove: jest.fn() };
    const module: TestingModule = await Test.createTestingModule({
      controllers: [WorkflowVersionController],
      providers: [
        { provide: WorkflowVersionService, useValue: workflowVersionService },
      ],
    }).compile();

    controller = module.get<WorkflowVersionController>(WorkflowVersionController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
