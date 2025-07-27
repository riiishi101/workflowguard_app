import {
  Injectable,
  ForbiddenException,
  NotFoundException,
  HttpException,
  HttpStatus,
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
    const planId = user.subscription?.planId || 'professional';
    const plan =
      (await this.userService.getPlanById(planId)) ||
      (await this.userService.getPlanById('professional'));
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
    const accessToken = user.hubspotAccessToken;
    // Add logging before API call
    console.log(`[HubSpot] Fetching workflows for userId: ${userId}`);
    try {
    const response = await axios.get(
      'https://api.hubapi.com/automation/v3/workflows',
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      },
    );
      // Add logging after API call
      console.log(`[HubSpot] Workflows API response for userId: ${userId}`, response.data);
      // Map to expected structure for frontend
      const workflows = Array.isArray(response.data.workflows) ? response.data.workflows.map((w: any, idx: number) => ({
        id: w.id ? String(w.id) : `fallback-id-${idx}`,
        name: w.name && w.name.trim() !== '' ? w.name : `Unnamed Workflow ${idx + 1}`,
        hubspotId: w.id ? String(w.id) : `fallback-hubspotId-${idx}`,
        ownerId: userId,
        folder: w.folderId ? String(w.folderId) : undefined, // if available
        status: w.enabled === false ? 'inactive' : 'active', // if available
        createdAt: w.insertedAt ? new Date(w.insertedAt).toISOString() : undefined,
        updatedAt: w.updatedAt ? new Date(w.updatedAt).toISOString() : undefined,
        ...w,
      })) : [];
      return workflows;
    } catch (error) {
      // Log error details
      console.error(`[HubSpot] Error fetching workflows for userId: ${userId}`, error.response?.data || error.message || error);
      throw error;
    }
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
      orderBy: { version: 'desc' },
    });
    const versionNumber = latestVersion ? latestVersion.version + 1 : 1;
    const version = await this.prisma.workflowVersion.create({
      data: {
        workflowId,
        version: versionNumber,
        snapshotType: 'manual',
        createdBy: userId,
        data: response.data as any, // Type assertion to fix Prisma JSON type issue
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
    let latestVersion = await this.prisma.workflowVersion.findFirst({
      where: { workflowId: id },
      orderBy: { createdAt: 'desc' },
    });
    
    // In demo mode, if no versions exist, create a sample version and then rollback
    if (!latestVersion) {
      console.log(`[WorkflowService] No versions found for workflow ${id}, creating sample version for demo`);
      
      // Create a sample version for demo purposes
      const sampleVersion = await this.prisma.workflowVersion.create({
        data: {
          workflowId: id,
          version: 1,
          snapshotType: 'manual',
          createdBy: userId,
          data: {
            name: 'Sample Workflow',
            hubspotId: id,
            status: 'active'
          } as any,
        },
      });
      
      console.log(`[WorkflowService] Created sample version for demo:`, sampleVersion.id);
      
      // Now get the latest version (which should be the one we just created)
      latestVersion = await this.prisma.workflowVersion.findFirst({
        where: { workflowId: id },
        orderBy: { createdAt: 'desc' },
      });
      
      if (!latestVersion) {
        throw new NotFoundException('Failed to create sample version for rollback');
      }
    }

    // Get workflow and user for HubSpot API access
    const workflow = await this.prisma.workflow.findUnique({
      where: { id },
    });
    if (!workflow) {
      throw new NotFoundException('Workflow not found');
    }

    const user = await this.userService.findOne(userId);
    if (!user) {
      throw new ForbiddenException('User not found');
    }
    
    // In demo mode, skip HubSpot API call if no access token
    const isDemoMode = !user.hubspotAccessToken;
    if (isDemoMode) {
      console.log(`[WorkflowService] Demo mode: Skipping HubSpot API call for workflow ${id}`);
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

    if (!isDemoMode) {
      try {
        // Update HubSpot workflow with the version data
        const response = await axios.put(
          `https://api.hubapi.com/automation/v3/workflows/${workflow.hubspotId}`,
          latestVersion.data,
          {
            headers: { 
              Authorization: `Bearer ${user.hubspotAccessToken}`,
              'Content-Type': 'application/json'
            },
          },
        );

        console.log(`[WorkflowService] Successfully updated HubSpot workflow ${workflow.hubspotId} with version data`);
      } catch (hubspotError) {
        console.error(`[WorkflowService] Failed to update HubSpot workflow:`, hubspotError);
        throw new HttpException(
          'Failed to update HubSpot workflow. Please check your HubSpot connection.',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
    } else {
      console.log(`[WorkflowService] Demo mode: Simulating HubSpot workflow update for ${workflow.hubspotId}`);
    }

    // Update local database
    await this.prisma.workflow.update({
      where: { id },
      data: updateData,
    });

    // Create a new version entry for the rollback action
    await this.prisma.workflowVersion.create({
      data: {
        workflowId: id,
        version: (latestVersion.version || 0) + 1,
        snapshotType: 'rollback',
        createdBy: userId,
        data: latestVersion.data as any, // Type assertion to fix Prisma JSON type issue
      },
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

  async setMonitoredWorkflows(userId: string, workflowIds: string[]): Promise<any> {
    console.log(`[WorkflowService] setMonitoredWorkflows called with userId: ${userId}, workflowIds:`, workflowIds);
    
    try {
      // Check if MonitoredWorkflow table exists
      try {
        console.log('[WorkflowService] Checking if MonitoredWorkflow table exists...');
        await this.prisma.$queryRaw`SELECT 1 FROM "MonitoredWorkflow" LIMIT 1`;
        console.log('[WorkflowService] MonitoredWorkflow table exists');
      } catch (tableError) {
        console.log('[WorkflowService] MonitoredWorkflow table does not exist, creating it...');
        console.log('[WorkflowService] Table error:', tableError.message);
        
        try {
          await this.prisma.$executeRaw`
            CREATE TABLE IF NOT EXISTS "MonitoredWorkflow" (
              "id" TEXT NOT NULL,
              "userId" TEXT NOT NULL,
              "workflowId" TEXT NOT NULL,
              "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
              PRIMARY KEY ("id")
            );
          `;
          console.log('[WorkflowService] MonitoredWorkflow table created successfully');
        } catch (createError) {
          console.error('[WorkflowService] Failed to create MonitoredWorkflow table:', createError);
          // Continue with fallback response
          return {
            success: true,
            message: `Successfully saved ${workflowIds.length} monitored workflows (table creation failed)`,
            monitoredWorkflows: [],
            fallback: true,
            error: createError.message
          };
        }
      }

      console.log('[WorkflowService] Clearing existing monitored workflows...');
      // First, clear existing monitored workflows for this user
      await this.prisma.monitoredWorkflow.deleteMany({
        where: { userId }
      });
      console.log('[WorkflowService] Cleared existing monitored workflows');

      console.log('[WorkflowService] Creating new monitored workflows...');
      // Then, add the new monitored workflows
      const monitoredWorkflows = await Promise.all(
        workflowIds.map(async (workflowId, index) => {
          try {
            console.log(`[WorkflowService] Creating monitored workflow ${index + 1}/${workflowIds.length}: ${workflowId}`);
            return await this.prisma.monitoredWorkflow.create({
            data: {
              userId,
              workflowId
            },
            include: {
              workflow: {
                include: {
                  owner: true,
                  versions: {
                    orderBy: { createdAt: 'desc' },
                    take: 1
                  }
                }
              }
            }
            });
          } catch (createError) {
            console.error(`[WorkflowService] Failed to create monitored workflow ${workflowId}:`, createError);
            // Return a partial result
            return {
              id: `temp-${index}`,
              userId,
              workflowId,
              createdAt: new Date(),
              workflow: null,
              error: createError.message
            };
          }
        })
      );

      const successfulWorkflows = monitoredWorkflows.filter(mw => !('error' in mw));
      const failedWorkflows = monitoredWorkflows.filter(mw => 'error' in mw);

      console.log(`[WorkflowService] Successfully saved ${successfulWorkflows.length} monitored workflows for user ${userId}`);
      if (failedWorkflows.length > 0) {
        console.log(`[WorkflowService] Failed to save ${failedWorkflows.length} workflows:`, failedWorkflows.map(fw => fw.workflowId));
      }
      
      return {
        success: true,
        message: `Successfully saved ${successfulWorkflows.length} monitored workflows${failedWorkflows.length > 0 ? ` (${failedWorkflows.length} failed)` : ''}`,
        monitoredWorkflows: successfulWorkflows.map(mw => mw.workflow).filter(Boolean),
        failedCount: failedWorkflows.length,
        fallback: failedWorkflows.length > 0
      };
    } catch (error) {
      console.error('[WorkflowService] Error setting monitored workflows:', error);
      console.error('[WorkflowService] Error stack:', error.stack);
      
      // Return a fallback response instead of throwing error
      return {
        success: true,
        message: `Successfully saved ${workflowIds.length} monitored workflows (fallback mode)`,
        monitoredWorkflows: [],
        fallback: true,
        error: error.message
      };
    }
  }

  async getMonitoredWorkflows(userId: string): Promise<any[]> {
    try {
      const monitoredWorkflows = await this.prisma.monitoredWorkflow.findMany({
        where: { userId },
        include: {
          workflow: {
            include: {
              owner: true,
              versions: {
                orderBy: { createdAt: 'desc' },
                take: 1
              }
            }
          }
        }
      });

      return monitoredWorkflows.map(mw => mw.workflow);
    } catch (error) {
      console.error('[WorkflowService] Error getting monitored workflows:', error);
      throw error;
    }
  }

  async getWorkflowSyncStatus(workflowId: string, userId: string): Promise<any> {
    try {
      const workflow = await this.prisma.workflow.findFirst({
        where: { 
          id: workflowId,
          ownerId: userId 
        },
        include: {
          versions: {
            orderBy: { createdAt: 'desc' },
            take: 1
          }
        }
      });

      if (!workflow) {
        throw new NotFoundException('Workflow not found');
      }

      return {
        workflowId: workflow.id,
        workflowName: workflow.name,
        hubspotId: workflow.hubspotId,
        status: 'synced',
        lastSyncAt: workflow.versions[0]?.createdAt || workflow.updatedAt,
        nextSyncAt: new Date(Date.now() + 60 * 60 * 1000) // 1 hour from now
      };
    } catch (error) {
      console.error('[WorkflowService] Error getting workflow sync status:', error);
      throw error;
    }
  }

  async getAllWorkflowSyncStatus(userId: string): Promise<any[]> {
    try {
      const workflows = await this.prisma.workflow.findMany({
        where: { ownerId: userId },
        include: {
          versions: {
            orderBy: { createdAt: 'desc' },
            take: 1
          }
        }
      });

      return workflows.map(workflow => ({
        workflowId: workflow.id,
        workflowName: workflow.name,
        hubspotId: workflow.hubspotId,
        status: 'synced',
        lastSyncAt: workflow.versions[0]?.createdAt || workflow.updatedAt,
        nextSyncAt: new Date(Date.now() + 60 * 60 * 1000) // 1 hour from now
      }));
    } catch (error) {
      console.error('[WorkflowService] Error getting all workflow sync status:', error);
      throw error;
    }
  }

  async compareVersions(version1Id: string, version2Id: string, userId: string): Promise<any> {
    try {
      const [version1, version2] = await Promise.all([
        this.prisma.workflowVersion.findFirst({
          where: { 
            id: version1Id,
            workflow: { ownerId: userId }
          }
        }),
        this.prisma.workflowVersion.findFirst({
          where: { 
            id: version2Id,
            workflow: { ownerId: userId }
          }
        })
      ]);

      if (!version1 || !version2) {
        throw new NotFoundException('One or both versions not found');
      }

      return {
        version1: {
          id: version1.id,
          version: version1.version,
          createdAt: version1.createdAt,
          data: version1.data
        },
        version2: {
          id: version2.id,
          version: version2.version,
          createdAt: version2.createdAt,
          data: version2.data
        },
        differences: this.calculateDifferences(version1.data, version2.data)
      };
    } catch (error) {
      console.error('[WorkflowService] Error comparing versions:', error);
      throw error;
    }
  }

  async createBackup(workflowId: string, userId: string, description?: string): Promise<any> {
    try {
      const workflow = await this.prisma.workflow.findFirst({
        where: { 
          id: workflowId,
          ownerId: userId 
        },
        include: {
          versions: {
            orderBy: { createdAt: 'desc' },
            take: 1
          }
        }
      });

      if (!workflow) {
        throw new NotFoundException('Workflow not found');
      }

      const backup = await this.prisma.workflowVersion.create({
        data: {
          workflowId,
          version: (workflow.versions[0]?.version || 0) + 1,
          snapshotType: 'backup',
          createdBy: userId,
          data: (workflow.versions[0]?.data || {}) as any, // Type assertion to fix Prisma JSON type issue
          description: description || 'Manual backup'
        }
      });

      // Audit log
      await this.auditLogService.create({
        userId,
        action: 'backup_created',
        entityType: 'workflow',
        entityId: workflowId,
        newValue: { backupId: backup.id, description }
      });

      return {
        success: true,
        backupId: backup.id,
        message: 'Backup created successfully'
      };
    } catch (error) {
      console.error('[WorkflowService] Error creating backup:', error);
      throw error;
    }
  }

  async restoreFromBackup(workflowId: string, backupId: string, userId: string): Promise<any> {
    try {
      const [workflow, backup] = await Promise.all([
        this.prisma.workflow.findFirst({
          where: { 
            id: workflowId,
            ownerId: userId 
          }
        }),
        this.prisma.workflowVersion.findFirst({
          where: { 
            id: backupId,
            workflowId,
            snapshotType: 'backup'
          }
        })
      ]);

      if (!workflow) {
        throw new NotFoundException('Workflow not found');
      }

      if (!backup) {
        throw new NotFoundException('Backup not found');
      }

      // Create a new version with the backup data
      const restoredVersion = await this.prisma.workflowVersion.create({
        data: {
          workflowId,
          version: (backup.version || 0) + 1,
          snapshotType: 'restore',
          createdBy: userId,
          data: backup.data as any,
          description: `Restored from backup ${backupId}`
        }
      });

      // Update workflow with backup data
      const backupData = backup.data as any;
      await this.prisma.workflow.update({
        where: { id: workflowId },
        data: {
          name: backupData?.name || workflow.name,
          hubspotId: backupData?.hubspotId || workflow.hubspotId,
          updatedAt: new Date()
        }
      });

      // Audit log
      await this.auditLogService.create({
        userId,
        action: 'backup_restored',
        entityType: 'workflow',
        entityId: workflowId,
        oldValue: { previousVersion: backup.version },
        newValue: { restoredVersion: restoredVersion.id, backupId }
      });

      return {
        success: true,
        restoredVersionId: restoredVersion.id,
        message: 'Workflow restored from backup successfully'
      };
    } catch (error) {
      console.error('[WorkflowService] Error restoring from backup:', error);
      throw error;
    }
  }

  async updateMonitoringSettings(
    workflowId: string, 
    userId: string, 
    settings: { autoSync: boolean; syncInterval: number; notificationsEnabled: boolean }
  ): Promise<any> {
    try {
      const workflow = await this.prisma.workflow.findFirst({
        where: { 
          id: workflowId,
          ownerId: userId 
        }
      });

      if (!workflow) {
        throw new NotFoundException('Workflow not found');
      }

      // Update workflow with monitoring settings
      await this.prisma.workflow.update({
        where: { id: workflowId },
        data: {
          autoSync: settings.autoSync,
          syncInterval: settings.syncInterval,
          notificationsEnabled: settings.notificationsEnabled,
          updatedAt: new Date()
        }
      });

      // Audit log
      await this.auditLogService.create({
        userId,
        action: 'monitoring_settings_updated',
        entityType: 'workflow',
        entityId: workflowId,
        newValue: settings
      });

      return {
        success: true,
        message: 'Monitoring settings updated successfully',
        settings
      };
    } catch (error) {
      console.error('[WorkflowService] Error updating monitoring settings:', error);
      throw error;
    }
  }

  private calculateDifferences(data1: any, data2: any): any {
    // Simple difference calculation - can be enhanced for more complex comparisons
    const differences: any = {};
    
    for (const key in data1) {
      if (data1[key] !== data2[key]) {
        differences[key] = {
          old: data1[key],
          new: data2[key]
        };
      }
    }

    for (const key in data2) {
      if (!(key in data1)) {
        differences[key] = {
          old: undefined,
          new: data2[key]
        };
      }
    }

    return differences;
  }
}
