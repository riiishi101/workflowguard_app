import { Test, TestingModule } from '@nestjs/testing';
import { WorkflowService } from './workflow.service';
import { PrismaService } from '../prisma/prisma.service';
import { UserService } from '../user/user.service';
import { AuditLogService } from '../audit-log/audit-log.service';

describe('WorkflowService', () => {
  let service: WorkflowService;
  let prisma: any;
  let userService: any;
  let auditLogService: any;

  beforeEach(async () => {
    prisma = { workflow: { count: jest.fn(), create: jest.fn(), findMany: jest.fn(), findUnique: jest.fn(), findFirst: jest.fn(), update: jest.fn(), delete: jest.fn(), }, overage: { upsert: jest.fn() } };
    userService = { findOneWithSubscription: jest.fn(), getPlanById: jest.fn(), findOne: jest.fn() };
    auditLogService = { create: jest.fn() };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WorkflowService,
        { provide: PrismaService, useValue: prisma },
        { provide: UserService, useValue: userService },
        { provide: AuditLogService, useValue: auditLogService },
      ],
    }).compile();

    service = module.get<WorkflowService>(WorkflowService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
