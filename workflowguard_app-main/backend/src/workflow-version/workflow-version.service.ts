import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WorkflowVersion, Prisma } from '@prisma/client';
import { CreateWorkflowVersionDto } from './dto/create-workflow-version.dto';
import { PLAN_CONFIG } from '../plan-config';
import { UserService } from '../user/user.service';
import { AuditLogService } from '../audit-log/audit-log.service';

@Injectable()
export class WorkflowVersionService {
  constructor(private prisma: PrismaService, private userService: UserService, private auditLogService: AuditLogService) {}

  async create(data: CreateWorkflowVersionDto): Promise<WorkflowVersion> {
    const { workflowId, ...rest } = data;
    const isRestore = rest.snapshotType === 'restore';
    let oldVersion = null;
    if (isRestore) {
      oldVersion = await this.findLatestByWorkflowId(workflowId);
    }
    const newVersion = await this.prisma.workflowVersion.create({
      data: {
        ...rest,
        workflow: { connect: { id: workflowId } },
      },
      include: {
        workflow: true,
      },
    });
    if (isRestore) {
      await this.auditLogService.create({
        userId: rest.createdBy,
        action: 'restore',
        entityType: 'workflow',
        entityId: workflowId,
        oldValue: oldVersion,
        newValue: newVersion,
      });
    }
    return newVersion;
  }

  async findAll(): Promise<WorkflowVersion[]> {
    return this.prisma.workflowVersion.findMany({
      include: {
        workflow: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findByWorkflowId(workflowId: string): Promise<WorkflowVersion[]> {
    return this.prisma.workflowVersion.findMany({
      where: { workflowId },
      include: {
        workflow: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: string): Promise<WorkflowVersion | null> {
    return this.prisma.workflowVersion.findUnique({
      where: { id },
      include: {
        workflow: true,
      },
    });
  }

  async findLatestByWorkflowId(workflowId: string): Promise<WorkflowVersion | null> {
    return this.prisma.workflowVersion.findFirst({
      where: { workflowId },
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        workflow: true,
      },
    });
  }

  async update(id: string, data: Prisma.WorkflowVersionUpdateInput): Promise<WorkflowVersion> {
    return this.prisma.workflowVersion.update({
      where: { id },
      data,
      include: {
        workflow: true,
      },
    });
  }

  async remove(id: string): Promise<WorkflowVersion> {
    return this.prisma.workflowVersion.delete({
      where: { id },
    });
  }

  async findByWorkflowIdWithHistoryLimit(workflowId: string, userId: string): Promise<WorkflowVersion[]> {
    const user = await this.userService.findOneWithSubscription(userId);
    const planId = (user?.subscription?.planId as keyof typeof PLAN_CONFIG) || 'starter';
    const plan = PLAN_CONFIG[planId] || PLAN_CONFIG['starter'];
    let where: any = { workflowId };
    if (plan.historyDays !== null) {
      const cutoff = new Date(Date.now() - plan.historyDays * 24 * 60 * 60 * 1000);
      where.createdAt = { gte: cutoff };
    }
    return this.prisma.workflowVersion.findMany({
      where,
      include: { workflow: true },
      orderBy: { createdAt: 'desc' },
    });
  }
}
