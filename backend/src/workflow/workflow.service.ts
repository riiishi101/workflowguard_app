import {
  Injectable,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Workflow, Prisma } from '@prisma/client';
import { CreateWorkflowDto } from './dto/create-workflow.dto';
import { UserService } from '../user/user.service';
import axios from 'axios';
import { AuditLogService } from '../audit-log/audit-log.service';

@Injectable()
export class WorkflowService {
  constructor(
    private prisma: PrismaService,
    private userService: UserService,
    private auditLogService: AuditLogService,
  ) {}

  async create(data: CreateWorkflowDto): Promise<Workflow> {
    const { ownerId, ...rest } = data;
    // Fetch user with subscription
    const user = await this.userService.findOneWithSubscription(ownerId);
    if (!user) throw new ForbiddenException('User not found');
    const planId = user.subscription?.planId || 'starter';
    const plan =
      (await this.userService.getPlanById(planId)) ||
      (await this.userService.getPlanById('starter'));
    const count = await this.prisma.workflow.count({ where: { ownerId } });
    let isOverage = false;
    if (plan?.maxWorkflows !== null && plan?.maxWorkflows !== undefined) {
      if (count >= plan.maxWorkflows) {
        isOverage = true;
      }
    }
    const workflow = await this.prisma.workflow.create({
      data: {
        ...rest,
        owner: { connect: { id: ownerId } },
      },
      include: {
        owner: true,
        versions: true,
      },
    });
    if (isOverage) {
      // Record overage for this billing period
      const now = new Date();
      const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const periodEnd = new Date(
        now.getFullYear(),
        now.getMonth() + 1,
        0,
        23,
        59,
        59,
        999,
      );
      await this.prisma.overage.upsert({
        where: {
          userId_type_periodStart_periodEnd: {
            userId: ownerId,
            type: 'workflow',
            periodStart,
            periodEnd,
          },
        },
        update: { amount: { increment: 1 } },
        create: {
          userId: ownerId,
          type: 'workflow',
          amount: 1,
          periodStart,
          periodEnd,
        },
      });
    }
    // Audit log
    await this.auditLogService.create({
      userId: ownerId,
      action: 'create',
      entityType: 'workflow',
      entityId: workflow.id,
      newValue: workflow,
    });
    return workflow;
  }

  async findAll(): Promise<Workflow[]> {
    return this.prisma.workflow.findMany({
      include: {
        owner: true,
        versions: {
          orderBy: {
            createdAt: 'desc',
          },
          take: 1,
        },
      },
    });
  }

  async findOne(id: string): Promise<Workflow | null> {
    return this.prisma.workflow.findUnique({
      where: { id },
      include: {
        owner: true,
        versions: {
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });
  }

  async findByHubspotId(hubspotId: string): Promise<Workflow | null> {
    return this.prisma.workflow.findFirst({
      where: { hubspotId },
      include: {
        owner: true,
        versions: {
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });
  }

  async update(
    id: string,
    data: Prisma.WorkflowUpdateInput & { updatedBy?: string },
  ): Promise<Workflow> {
    const oldWorkflow = await this.prisma.workflow.findUnique({
      where: { id },
    });
    const workflow = await this.prisma.workflow.update({
      where: { id },
      data,
      include: {
        owner: true,
        versions: true,
      },
    });
    // Audit log
    await this.auditLogService.create({
      userId: (data as any).updatedBy,
      action: 'update',
      entityType: 'workflow',
      entityId: workflow.id,
      oldValue: oldWorkflow,
      newValue: workflow,
    });
    return workflow;
  }

  async remove(id: string, userId?: string): Promise<Workflow> {
    const oldWorkflow = await this.prisma.workflow.findUnique({
      where: { id },
    });
    const workflow = await this.prisma.workflow.delete({ where: { id } });
    // Audit log
    await this.auditLogService.create({
      userId,
      action: 'delete',
      entityType: 'workflow',
      entityId: id,
      oldValue: oldWorkflow,
    });
    return workflow;
  }

  async getWorkflowsFromHubSpot(userId: string): Promise<any[]> {
    // Get user and their valid HubSpot access token
    const user = await this.userService.findOne(userId);
    if (!user || !user.hubspotAccessToken) {
      throw new ForbiddenException('No HubSpot access token found for user');
    }
    // Optionally refresh token if expired (implement if needed)
    // const accessToken = await this.userService.getValidHubspotAccessToken(user);
    const accessToken = user.hubspotAccessToken;
    // Fetch workflows from HubSpot
    const response = await axios.get(
      'https://api.hubapi.com/automation/v3/workflows',
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      },
    );
    return response.data.workflows || [];
  }

  async snapshotFromHubSpot(workflowId: string, userId: string) {
    // 1. Find workflow in your DB to get hubspotId
    const workflow = await this.prisma.workflow.findUnique({
      where: { id: workflowId },
    });
    if (!workflow) throw new NotFoundException('Workflow not found');
    // 2. Get user and valid access token
    const user = await this.userService.findOne(userId);
    if (!user || !user.hubspotAccessToken)
      throw new ForbiddenException('No HubSpot access token');
    // 3. Fetch latest workflow details from HubSpot
    const response = await axios.get(
      `https://api.hubapi.com/automation/v3/workflows/${workflow.hubspotId}`,
      {
        headers: { Authorization: `Bearer ${user.hubspotAccessToken}` },
      },
    );
    // 4. Create new WorkflowVersion in your DB
    const latestVersion = await this.prisma.workflowVersion.findFirst({
      where: { workflowId },
      orderBy: { versionNumber: 'desc' },
    });
    const versionNumber = latestVersion ? latestVersion.versionNumber + 1 : 1;
    const version = await this.prisma.workflowVersion.create({
      data: {
        workflowId,
        versionNumber,
        snapshotType: 'manual',
        createdBy: userId,
        data: response.data,
      },
    });
    // Audit log
    await this.auditLogService.create({
      userId,
      action: 'sync',
      entityType: 'workflow',
      entityId: workflowId,
      newValue: version,
    });
    return version;
  }

  async rollback(id: string, userId: string): Promise<void> {
    // Find the latest version for this workflow
    const latestVersion = await this.prisma.workflowVersion.findFirst({
      where: { workflowId: id },
      orderBy: { createdAt: 'desc' },
    });
    if (!latestVersion) {
      throw new NotFoundException('No version found to rollback to');
    }
    // Update the workflow's data to match the latest version
    const oldWorkflow = await this.prisma.workflow.findUnique({
      where: { id },
    });
    const updateData: any = {};
    if (
      latestVersion.data &&
      typeof latestVersion.data === 'object' &&
      !Array.isArray(latestVersion.data)
    ) {
      // Map fields from the version's data JSON to the Workflow model
      if ('name' in latestVersion.data)
        updateData.name = latestVersion.data.name;
      if ('hubspotId' in latestVersion.data)
        updateData.hubspotId = latestVersion.data.hubspotId;
      // Add more fields as needed
    }
    if (Object.keys(updateData).length === 0) {
      throw new NotFoundException(
        'No valid fields found in version data to restore',
      );
    }
    await this.prisma.workflow.update({
      where: { id },
      data: updateData,
    });
    // Audit log
    await this.auditLogService.create({
      userId,
      action: 'rollback',
      entityType: 'workflow',
      entityId: id,
      oldValue: oldWorkflow,
      newValue: updateData,
    });
  }

  private isWorkflowChanged(hubspotData: any, latestVersion: any): boolean {
    if (!latestVersion) return true;
    // Compare the raw data (can be improved for deep diff)
    return JSON.stringify(hubspotData) !== JSON.stringify(latestVersion.data);
  }
}
