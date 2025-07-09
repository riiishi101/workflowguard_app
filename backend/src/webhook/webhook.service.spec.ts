import { Test, TestingModule } from '@nestjs/testing';
import { WebhookService } from './webhook.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuditLogService } from '../audit-log/audit-log.service';

describe('WebhookService', () => {
  let service: WebhookService;
  let prisma: any;
  let auditLogService: any;

  beforeEach(async () => {
    prisma = { webhook: { create: jest.fn(), findMany: jest.fn(), findUnique: jest.fn(), delete: jest.fn() } };
    auditLogService = { create: jest.fn() };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WebhookService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditLogService, useValue: auditLogService },
      ],
    }).compile();

    service = module.get<WebhookService>(WebhookService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
