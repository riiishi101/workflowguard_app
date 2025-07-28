import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from './user.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuditLogService } from '../audit-log/audit-log.service';
import { NotificationService } from '../notification/notification.service';
import { EmailService } from '../services/email.service';
import { CreateUserDto } from './dto/create-user.dto';

describe('UserService', () => {
  let service: UserService;
  let prisma: any;
  let auditLog: any;
  let notification: any;
  let email: any;

  beforeEach(async () => {
    prisma = {
      user: {
        create: jest.fn(),
        findUnique: jest.fn(),
      },
    };
    auditLog = { create: jest.fn() };
    notification = {};
    email = {};

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditLogService, useValue: auditLog },
        { provide: NotificationService, useValue: notification },
        { provide: EmailService, useValue: email },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should create a user with valid data', async () => {
    const dto: CreateUserDto = {
      email: 'test@example.com',
      name: 'Test',
      role: 'admin',
    };
    const createdUser = { id: '1', ...dto };
    prisma.user.create.mockResolvedValue(createdUser);
    auditLog.create.mockResolvedValue({});
    const result = await service.create(dto, 'actorId');
    expect(result).toEqual(createdUser);
    expect(prisma.user.create).toHaveBeenCalledWith({
      data: { ...dto, role: 'admin' },
    });
    expect(auditLog.create).toHaveBeenCalledWith({
      userId: 'actorId',
      action: 'create',
      entityType: 'user',
      entityId: createdUser.id,
      newValue: createdUser,
    });
  });

  it('should assign default role if not provided', async () => {
    const dto: CreateUserDto = { email: 'test2@example.com', name: 'Test2' };
    const createdUser = { id: '2', ...dto, role: 'viewer' };
    prisma.user.create.mockResolvedValue(createdUser);
    auditLog.create.mockResolvedValue({});
    const result = await service.create(dto, 'actorId');
    expect(result.role).toBe('viewer');
  });

  // Add more tests for error cases, e.g., prisma.user.create throws, auditLog.create throws, etc.
});
