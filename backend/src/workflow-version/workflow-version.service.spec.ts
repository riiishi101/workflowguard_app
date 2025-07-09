import { Test, TestingModule } from '@nestjs/testing';
import { WorkflowVersionService } from './workflow-version.service';
import { PrismaService } from '../prisma/prisma.service';
import { UserService } from '../user/user.service';
import { AuditLogService } from '../audit-log/audit-log.service';

describe('WorkflowVersionService', () => {
  let service: WorkflowVersionService;
  let prisma: any;
  let userService: any;
  let auditLogService: any;

  beforeEach(async () => {
    prisma = { workflowVersion: { create: jest.fn(), findMany: jest.fn(), findUnique: jest.fn(), findFirst: jest.fn(), update: jest.fn(), delete: jest.fn() } };
    userService = { findOneWithSubscription: jest.fn() };
    auditLogService = { create: jest.fn() };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WorkflowVersionService,
        { provide: PrismaService, useValue: prisma },
        { provide: UserService, useValue: userService },
        { provide: AuditLogService, useValue: auditLogService },
      ],
    }).compile();

    service = module.get<WorkflowVersionService>(WorkflowVersionService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
