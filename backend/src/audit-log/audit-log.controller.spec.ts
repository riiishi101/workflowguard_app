import { Test, TestingModule } from '@nestjs/testing';
import { AuditLogController } from './audit-log.controller';
import { AuditLogService } from './audit-log.service';
import { UserService } from '../user/user.service';

describe('AuditLogController', () => {
  let controller: AuditLogController;
  let auditLogService: any;
  let userService: any;

  beforeEach(async () => {
    auditLogService = {
      findAll: jest.fn(),
      findByUser: jest.fn(),
      findByEntity: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    };
    userService = { findOne: jest.fn() };
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuditLogController],
      providers: [
        { provide: AuditLogService, useValue: auditLogService },
        { provide: UserService, useValue: userService },
      ],
    }).compile();
    controller = module.get<AuditLogController>(AuditLogController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
