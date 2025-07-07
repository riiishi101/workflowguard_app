import { Test, TestingModule } from '@nestjs/testing';
import { WorkflowVersionService } from './workflow-version.service';

describe('WorkflowVersionService', () => {
  let service: WorkflowVersionService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [WorkflowVersionService],
    }).compile();

    service = module.get<WorkflowVersionService>(WorkflowVersionService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
