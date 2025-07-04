import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Workflow, Prisma } from '@prisma/client';
import { CreateWorkflowDto } from './dto/create-workflow.dto';
import { UserService } from '../user/user.service';
import axios from 'axios';

@Injectable()
export class WorkflowService {
  constructor(private prisma: PrismaService, private userService: UserService) {}

  async create(data: CreateWorkflowDto): Promise<Workflow> {
    const { ownerId, ...rest } = data;
    // Fetch user with subscription
    const user = await this.userService.findOneWithSubscription(ownerId);
    if (!user) throw new ForbiddenException('User not found');
    const planId = user.subscription?.planId || 'starter';
    const plan = await this.userService.getPlanById(planId) || await this.userService.getPlanById('starter');
    let count = await this.prisma.workflow.count({ where: { ownerId } });
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
      const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
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

  async update(id: string, data: Prisma.WorkflowUpdateInput): Promise<Workflow> {
    return this.prisma.workflow.update({
      where: { id },
      data,
      include: {
        owner: true,
        versions: true,
      },
    });
  }

  async remove(id: string): Promise<Workflow> {
    return this.prisma.workflow.delete({
      where: { id },
    });
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
    const response = await axios.get('https://api.hubapi.com/automation/v3/workflows', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    return response.data.workflows || [];
  }

  async snapshotFromHubSpot(workflowId: string, userId: string) {
    // 1. Find workflow in your DB to get hubspotId
    const workflow = await this.prisma.workflow.findUnique({ where: { id: workflowId } });
    if (!workflow) throw new NotFoundException('Workflow not found');
    // 2. Get user and valid access token
    const user = await this.userService.findOne(userId);
    if (!user || !user.hubspotAccessToken) throw new ForbiddenException('No HubSpot access token');
    // 3. Fetch latest workflow details from HubSpot
    const response = await axios.get(`https://api.hubapi.com/automation/v3/workflows/${workflow.hubspotId}`, {
      headers: { Authorization: `Bearer ${user.hubspotAccessToken}` },
    });
    // 4. Create new WorkflowVersion in your DB
    const latestVersion = await this.prisma.workflowVersion.findFirst({
      where: { workflowId },
      orderBy: { versionNumber: 'desc' },
    });
    const versionNumber = latestVersion ? latestVersion.versionNumber + 1 : 1;
    return this.prisma.workflowVersion.create({
      data: {
        workflowId,
        versionNumber,
        snapshotType: 'manual',
        createdBy: userId,
        data: response.data,
      },
    });
  }

  private isWorkflowChanged(hubspotData: any, latestVersion: any): boolean {
    if (!latestVersion) return true;
    // Compare the raw data (can be improved for deep diff)
    return JSON.stringify(hubspotData) !== JSON.stringify(latestVersion.data);
  }
}
