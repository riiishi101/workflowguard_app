import {
  Injectable,
  HttpException,
  HttpStatus,
  forwardRef,
  Inject,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateWorkflowDto,
  UpdateWorkflowDto,
  HubSpotWorkflow,
  WorkflowDetails,
  ProtectedWorkflowDto,
  WorkflowDto,
  ProtectedWorkflowDetailsDto,
  DashboardStatsDto,
  WorkflowStatsDto,
} from './dto';
import { HubSpotService } from '../services/hubspot.service';
import { WorkflowVersionService } from '../workflow-version/workflow-version.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class WorkflowService {
  constructor(
    private prisma: PrismaService,
    private hubspotService: HubSpotService,
    @Inject(forwardRef(() => WorkflowVersionService))
    private workflowVersionService: WorkflowVersionService,
  ) {}

  async create(createWorkflowDto: CreateWorkflowDto): Promise<any> {
    return this.prisma.workflow.create({
      data: createWorkflowDto,
    });
  }

  async findAll(): Promise<any[]> {
    return this.prisma.workflow.findMany({
      include: {
        owner: true,
        versions: true,
      },
    });
  }

  async getHubSpotWorkflows(userId: string): Promise<HubSpotWorkflow[]> {
    try {
      console.log(
        '🔍 WorkflowService - getHubSpotWorkflows called for userId:',
        userId,
      );
      const workflows = await this.hubspotService.getWorkflows(userId);
      console.log(
        '🔍 WorkflowService - Retrieved workflows from HubSpot:',
        workflows.length,
      );
      return workflows;
    } catch (error) {
      console.error(
        '🔍 WorkflowService - Error getting HubSpot workflows:',
        error,
      );
      throw new HttpException(
        `Failed to get HubSpot workflows: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async findOne(id: string, userId: string): Promise<WorkflowDetails> {
    try {
      const workflow = await this.prisma.workflow.findFirst({
        where: {
          id,
          ownerId: userId,
        },
        include: {
          owner: true,
          versions: {
            orderBy: {
              createdAt: 'desc',
            },
            take: 1, // Get latest version for lastModified
          },
        },
      });

      if (!workflow) {
        throw new HttpException('Workflow not found', HttpStatus.NOT_FOUND);
      }

      // Add computed fields
      const lastVersion = workflow.versions[0];
      return {
        ...workflow,
        lastModified: lastVersion?.createdAt || workflow.updatedAt,
        totalVersions: workflow.versions.length,
        hubspotUrl: workflow.hubspotId
          ? `https://app.hubspot.com/workflows/${workflow.hubspotId}`
          : null,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        `Failed to find workflow: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async findByHubspotId(
    hubspotId: string,
    userId: string,
  ): Promise<WorkflowDetails> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }

    try {
      // First try to find in database
      const workflow = await this.prisma.workflow.findFirst({
        where: {
          hubspotId: hubspotId,
          ownerId: userId,
        },
        include: {
          owner: true,
          versions: {
            orderBy: {
              createdAt: 'desc',
            },
          },
        },
      });

      if (workflow) {
        return {
          ...workflow,
          lastModified: workflow.updatedAt,
          totalVersions: workflow.versions.length || 0,
          hubspotUrl: `https://app.hubspot.com/workflows/${workflow.hubspotId}`,
        };
      }

      // If not found in database, try to get from HubSpot and create/sync
      const hubspotWorkflows = await this.hubspotService.getWorkflows(userId);
      const hubspotWorkflow = hubspotWorkflows.find((w) => w.id === hubspotId);

      if (!hubspotWorkflow) {
        // Return a default structure instead of throwing 404
        return {
          id: 'unknown',
          hubspotId: hubspotId,
          name: 'Unknown Workflow',
          ownerId: userId,
          createdAt: new Date(),
          updatedAt: new Date(),
          versions: [],
          totalVersions: 0,
          lastModified: new Date(),
          owner: user,
          isProtected: false,
          hubspotUrl: `https://app.hubspot.com/workflows/${hubspotId}`,
        } as WorkflowDetails;
      }

      // Create workflow in database if it doesn't exist
      const newWorkflow = await this.prisma.workflow.create({
        data: {
          hubspotId: hubspotId,
          name: hubspotWorkflow.name || `Workflow ${hubspotId}`,
          ownerId: userId,
        },
        include: {
          owner: true,
          versions: true,
        },
      });

      return {
        ...newWorkflow,
        lastModified: newWorkflow.updatedAt,
        totalVersions: 0,
      };
    } catch (error) {
      console.error('Error finding workflow by HubSpot ID:', error);
      // Return a default structure instead of throwing error
      return {
        id: 'error',
        hubspotId: hubspotId,
        name: 'Error Loading Workflow',
        ownerId: userId,
        createdAt: new Date(),
        updatedAt: new Date(),
        versions: [],
        totalVersions: 0,
        lastModified: new Date(),
        owner: user,
        isProtected: false,
        hubspotUrl: `https://app.hubspot.com/workflows/${hubspotId}`,
      } as WorkflowDetails;
    }
  }

  async update(
    id: string,
    updateWorkflowDto: UpdateWorkflowDto,
  ): Promise<any> {
    return this.prisma.workflow.update({
      where: { id },
      data: updateWorkflowDto,
    });
  }

  async remove(id: string): Promise<any> {
    return this.prisma.workflow.delete({
      where: { id },
    });
  }

  async startWorkflowProtection(
    workflowIds: string[],
    userId: string,
    selectedWorkflowObjects: WorkflowDto[],
  ): Promise<ProtectedWorkflowDto[]> {
    let finalUserId = userId;
    if (!finalUserId) {
      finalUserId = 'default-user-id';
    }

    // Check if user exists, create if not
    let user = await this.prisma.user.findUnique({
      where: { id: finalUserId },
    });
    if (!user) {
      user = await this.prisma.user.create({
        data: {
          id: finalUserId,
          email: 'default@example.com',
          name: 'Default User',
        },
      });
    }

    const protectedWorkflows = [];

    for (const workflowId of workflowIds) {
      try {
        // Find the workflow object from selectedWorkflowObjects
        const workflowObj = selectedWorkflowObjects?.find(
          (w: any) => w.id === workflowId,
        );
        // Always convert hubspotId to string for Prisma
        const hubspotId = String(workflowObj?.hubspotId || workflowObj?.id);

        // Try to find the workflow by hubspotId and ownerId
        const existingWorkflow = await this.prisma.workflow.findFirst({
          where: {
            hubspotId: hubspotId,
            ownerId: finalUserId,
          },
          include: {
            versions: {
              orderBy: { versionNumber: 'desc' },
              take: 1,
            },
          },
        });

        let workflow;
        if (existingWorkflow) {
          workflow = await this.prisma.workflow.update({
            where: { id: existingWorkflow.id },
            data: {
              updatedAt: new Date(),
            },
            include: {
              owner: true,
              versions: true,
            },
          });
        } else {
          workflow = await this.prisma.workflow.create({
            data: {
              hubspotId: hubspotId,
              name: workflowObj?.name || 'Unnamed Workflow',
              ownerId: finalUserId,
            },
            include: {
              owner: true,
              versions: true,
            },
          });
        }

        // Create initial version if no versions exist
        if (!existingWorkflow?.versions?.length) {
          try {
            // Get workflow data from HubSpot
            const hubspotWorkflows =
              await this.hubspotService.getWorkflows(finalUserId);
            const hubspotWorkflowData = hubspotWorkflows.find(
              (w) => String(w.id) === hubspotId,
            );

            // Use WorkflowVersionService to create initial version
            const initialVersion =
              await this.workflowVersionService.createInitialVersion(
                workflow,
                finalUserId,
                hubspotWorkflowData || {
                  hubspotId: hubspotId,
                  name: workflow.name,
                  status: 'active',
                  metadata: {
                    protection: {
                      initialProtection: true,
                      protectedAt: new Date().toISOString(),
                      protectedBy: finalUserId,
                    },
                  },
                } as any,
              );

            // Add the version to the workflow object
            workflow.versions = [initialVersion];

            console.log('Created initial version for workflow:', {
              workflowId: workflow.id,
              versionId: initialVersion.id,
              versionNumber: initialVersion.versionNumber,
            });
          } catch (versionError) {
            console.error('Error creating initial version for workflow:', {
              workflowId: workflow.id,
              error: versionError,
            });
            // Don't throw here, continue with protection even if version creation fails
          }
        }
        protectedWorkflows.push(workflow);
      } catch (err) {
        console.error('Error protecting workflow:', {
          workflowId,
          error: err,
          selectedWorkflowObjects,
          userId: finalUserId,
        });
        throw new HttpException(
          `Failed to protect workflow ${workflowId}: ${err?.message || err}`,
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
    }

    return protectedWorkflows;
  }

  async getProtectedWorkflows(
    userId: string,
  ): Promise<ProtectedWorkflowDetailsDto[]> {
    if (!userId) {
      return [];
    }

    try {
      const workflows = await this.prisma.workflow.findMany({
        where: { ownerId: userId },
        include: {
          owner: true,
          versions: true,
        },
        orderBy: { updatedAt: 'desc' },
      });

      // Transform database records to match Dashboard expectations
      return workflows.map((workflow: any) => ({
        id: workflow.hubspotId || workflow.id,
        name: workflow.name,
        status:
          workflow.versions && workflow.versions.length > 0
            ? 'active'
            : 'inactive',
        protectionStatus: 'protected', // All workflows in this endpoint are protected
        lastModified: workflow.updatedAt
          ? new Date(workflow.updatedAt).toLocaleDateString()
          : 'Unknown',
        versions: workflow.versions?.length || 1,
        lastModifiedBy: {
          name: workflow.owner?.name || 'Unknown User',
          initials: workflow.owner?.name
            ? workflow.owner.name
                .split(' ')
                .map((n: string) => n[0])
                .join('')
                .toUpperCase()
            : 'U',
          email: workflow.owner?.email || 'unknown@example.com',
        },
      }));
    } catch (error) {
      return [];
    }
  }

  async getProtectedWorkflowIds(userId: string): Promise<string[]> {
    const workflows = await this.getProtectedWorkflows(userId);
    return workflows.map((workflow) => workflow.id);
  }

  async syncHubSpotWorkflows(userId: string): Promise<ProtectedWorkflowDto[]> {
    try {
      const hubspotWorkflows = await this.hubspotService.getWorkflows(userId);

      const syncedWorkflows = [];

      for (const hubspotWorkflow of hubspotWorkflows) {
        const existingWorkflow = await this.prisma.workflow.findFirst({
          where: {
            hubspotId: String(hubspotWorkflow.id),
            ownerId: userId,
          },
        });

        if (existingWorkflow) {
          const updatedWorkflow = await this.prisma.workflow.update({
            where: { id: existingWorkflow.id },
            data: {
              name: hubspotWorkflow.name,
              updatedAt: new Date(),
            },
            include: {
              owner: true,
              versions: true,
            },
          });
          syncedWorkflows.push(updatedWorkflow);
        } else {
          const newWorkflow = await this.prisma.workflow.create({
            data: {
              hubspotId: String(hubspotWorkflow.id),
              name: hubspotWorkflow.name,
              ownerId: userId,
            },
            include: {
              owner: true,
              versions: true,
            },
          });
          syncedWorkflows.push(newWorkflow);
        }
      }

      return syncedWorkflows;
    } catch (error) {
      throw new HttpException(
        `Failed to sync HubSpot workflows: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async createAutomatedBackup(
    workflowId: string,
    userId: string,
  ): Promise<any> {
    try {
      const backup = await this.workflowVersionService.createAutomatedBackup(
        workflowId,
        userId,
      );
      return backup;
    } catch (error) {
      throw new HttpException(
        `Failed to create automated backup: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async createChangeNotification(
    workflowId: string,
    userId: string,
    changes: any,
  ): Promise<void> {
    try {
      await this.workflowVersionService.createChangeNotification(
        workflowId,
        userId,
        changes,
      );
    } catch (error) {
      throw new HttpException(
        `Failed to create change notification: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async createApprovalRequest(
    workflowId: string,
    userId: string,
    requestedChanges: any,
  ): Promise<any> {
    try {
      const approvalRequest =
        await this.workflowVersionService.createApprovalWorkflow(
          workflowId,
          userId,
          requestedChanges,
        );
      return approvalRequest;
    } catch (error) {
      throw new HttpException(
        `Failed to create approval request: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async generateComplianceReport(
    workflowId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<any> {
    try {
      const report = await this.workflowVersionService.generateComplianceReport(
        workflowId,
        startDate,
        endDate,
      );
      return report;
    } catch (error) {
      throw new HttpException(
        `Failed to generate compliance report: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async restoreWorkflowVersion(
    workflowId: string,
    versionId: string,
    userId: string,
  ): Promise<any> {
    try {
      const result = await this.workflowVersionService.restoreWorkflowVersion(
        workflowId,
        versionId,
        userId,
      );
      return result;
    } catch (error) {
      throw new HttpException(
        `Failed to restore workflow version: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async rollbackWorkflow(workflowId: string, userId: string): Promise<any> {
    try {
      const result = await this.workflowVersionService.rollbackWorkflow(
        workflowId,
        userId,
      );
      return result;
    } catch (error) {
      throw new HttpException(
        `Failed to rollback workflow: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async downloadWorkflowVersion(
    workflowId: string,
    versionId: string,
  ): Promise<any> {
    try {
      const version = await this.workflowVersionService.findOne(versionId);
      return version;
    } catch (error) {
      throw new HttpException(
        `Failed to download workflow version: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getWorkflowStats(userId: string): Promise<WorkflowStatsDto[]> {
    try {
      // Get workflows with version counts
      const workflows = await this.prisma.workflow.findMany({
        where: { ownerId: userId },
        include: {
          versions: {
            orderBy: { createdAt: 'desc' },
          },
        },
      });

      // Calculate detailed stats
      const stats = workflows.map((workflow: any) => {
        const versions = workflow.versions;
        const latestVersion = versions[0];
        const totalSteps = latestVersion
          ? this.calculateWorkflowSteps(latestVersion.data)
          : 0;
        const totalContacts = latestVersion
          ? this.calculateWorkflowContacts(latestVersion.data)
          : 0;

        return {
          id: workflow.id,
          name: workflow.name,
          lastSnapshot:
            latestVersion?.createdAt.toISOString() ||
            workflow.createdAt.toISOString(),
          versions: versions.length,
          lastModifiedBy: latestVersion?.createdBy || '',
          status: 'active' as 'active' | 'inactive',
          protectionStatus: 'protected' as 'protected' | 'unprotected',
          lastModified:
            latestVersion?.createdAt.toISOString() ||
            workflow.updatedAt.toISOString(),
          steps: totalSteps,
          contacts: totalContacts,
        };
      });

      return stats;
    } catch (error) {
      throw new HttpException(
        `Failed to get workflow stats: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getDashboardStats(userId: string): Promise<DashboardStatsDto> {
    try {
      // Get user with subscription for plan limits
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        include: { subscription: true },
      });

      if (!user) {
        throw new HttpException('User not found', HttpStatus.NOT_FOUND);
      }

      // Get protected workflows with optimized query
      const protectedWorkflows = await this.prisma.workflow.findMany({
        where: { ownerId: userId },
        include: {
          versions: {
            orderBy: { createdAt: 'desc' },
            take: 1, // Only get latest version for count
          },
        },
      });

      // Calculate stats efficiently
      const totalWorkflows = protectedWorkflows.length;
      const activeWorkflows = protectedWorkflows.filter(
        (w: any) => w.versions.length > 0,
      ).length;
      const totalVersions = protectedWorkflows.reduce(
        (sum, w: any) => sum + w.versions.length,
        0,
      );

      // Get recent activity (last 7 days)
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const recentActivity = await this.prisma.auditLog.count({
        where: {
          userId: userId,
          timestamp: { gte: sevenDaysAgo },
        },
      });

      // Calculate plan usage
      const planCapacity =
        user.subscription?.planId === 'professional'
          ? 25
          : user.subscription?.planId === 'enterprise'
            ? 999999
            : 5;
      const planUsed = totalWorkflows;

      // Uptime calculation should be implemented if available, else omit or set to null
      const uptime = null;

      // Get last snapshot time
      const lastSnapshot =
        protectedWorkflows.length > 0
          ? Math.max(
              ...protectedWorkflows.map((w) =>
                w.versions.length > 0
                  ? new Date(w.versions[0].createdAt).getTime()
                  : 0,
              ),
            )
          : Date.now();

      return {
        totalWorkflows,
        activeWorkflows,
        protectedWorkflows: totalWorkflows,
        totalVersions,
        uptime,
        lastSnapshot: new Date(lastSnapshot).toISOString(),
        planCapacity,
        planUsed,
        recentActivity,
        planId: user.subscription?.planId || 'starter',
        planStatus: user.subscription?.status || 'active',
      };
    } catch (error) {
      throw new HttpException(
        `Failed to get dashboard stats: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async exportWorkflow(workflowId: string): Promise<any> {
    try {
      const workflow = await this.prisma.workflow.findFirst({
        where: { id: workflowId },
        include: {
          owner: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          versions: {
            orderBy: {
              createdAt: 'desc',
            },
            select: {
              id: true,
              versionNumber: true,
              createdAt: true,
              data: true,
            },
          },
        },
      });

      if (!workflow) {
        throw new HttpException('Workflow not found', HttpStatus.NOT_FOUND);
      }

      // Transform data for export
      const exportData = {
        id: workflow.id,
        name: workflow.name,
        hubspotId: workflow.hubspotId,
        owner: workflow.owner,
        versions: workflow.versions.map((version: any) => ({
          id: version.id,
          versionNumber: version.versionNumber,
          createdAt: version.createdAt,
          data: version.data,
        })),
        createdAt: workflow.createdAt,
        updatedAt: workflow.updatedAt,
        exportedAt: new Date().toISOString(),
      };

      return exportData;
    } catch (error) {
      throw new HttpException(
        `Failed to export workflow: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async exportAllWorkflows(userId: string): Promise<any> {
    try {
      const workflows = await this.prisma.workflow.findMany({
        where: { ownerId: userId },
        include: {
          owner: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          versions: {
            orderBy: {
              createdAt: 'desc',
            },
            select: {
              id: true,
              versionNumber: true,
              createdAt: true,
              data: true,
            },
          },
        },
      });

      const exportData = {
        exportInfo: {
          userId,
          exportedAt: new Date().toISOString(),
          totalWorkflows: workflows.length,
        },
        workflows: workflows.map((workflow: any) => ({
          id: workflow.id,
          name: workflow.name,
          hubspotId: workflow.hubspotId,
          owner: workflow.owner,
          versions: workflow.versions.map((version: any) => ({
            id: version.id,
            versionNumber: version.versionNumber,
            createdAt: version.createdAt,
            data: version.data,
          })),
          createdAt: workflow.createdAt,
          updatedAt: workflow.updatedAt,
        })),
      };

      return exportData;

    } catch (error) {
      throw new HttpException(
        `Failed to export workflows: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  private calculateWorkflowSteps(workflowData: any): number {
    try {
      if (typeof workflowData === 'string') {
        workflowData = JSON.parse(workflowData);
      }

      // Count steps in workflow data
      if (workflowData.steps && Array.isArray(workflowData.steps)) {
        return workflowData.steps.length;
      }

      // Alternative counting method
      if (workflowData.actions && Array.isArray(workflowData.actions)) {
        return workflowData.actions.length;
      }

      return 0;
    } catch (error) {
      return 0;
    }
  }

  private calculateWorkflowContacts(workflowData: any): number {
    try {
      if (typeof workflowData === 'string') {
        workflowData = JSON.parse(workflowData);
      }

      // Contact count calculation should be implemented if available, else return 0
      return 0;
    } catch (error) {
      return 0;
    }
  }
}
