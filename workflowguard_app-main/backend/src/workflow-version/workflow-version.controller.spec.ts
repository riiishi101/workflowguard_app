import { Test, TestingModule } from '@nestjs/testing';
import { WorkflowVersionController } from './workflow-version.controller';

describe('WorkflowVersionController', () => {
  let controller: WorkflowVersionController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [WorkflowVersionController],
    }).compile();

    controller = module.get<WorkflowVersionController>(WorkflowVersionController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
