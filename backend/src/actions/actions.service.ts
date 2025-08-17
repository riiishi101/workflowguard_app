import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditLogService } from '../audit-log/audit-log.service';
import { CreateAuditLogDto } from '../audit-log/dto/create-audit-log.dto';
import { HubSpotService } from '../services/hubspot.service';
import { UpdateWorkflowPayload } from '../types/hubspot.types';

@Injectable()
export class ActionsService {
  constructor(
    private prisma: PrismaService,
    private auditLogService: AuditLogService,
    private hubspotService: HubSpotService,
  ) {}

  async protectWorkflow(workflowId: string): Promise<void> {
    console.log(`Protecting workflow ${workflowId}`);

    const workflow = await this.prisma.workflow.update({
      where: { hubspotId: workflowId },
      data: { isProtected: true },
    });

    const auditLog: CreateAuditLogDto = {
      action: 'protect_workflow',
      entityType: 'workflow',
      entityId: workflow.id, // Use internal DB ID
      oldValue: { isProtected: false },
      newValue: { isProtected: true },
    };
    await this.auditLogService.create(auditLog);
  }

  async rollbackWorkflow(workflowId: string, versionId: string): Promise<void> {
    console.log(`Rolling back workflow ${workflowId} to version ${versionId}`);

    const workflowVersion = await this.prisma.workflowVersion.findUnique({
      where: { id: versionId },
      include: {
        workflow: {
          include: {
            owner: true,
          },
        },
      },
    });

    if (!workflowVersion) {
      throw new NotFoundException(
        `Workflow version with ID ${versionId} not found.`,
      );
    }

    if (workflowVersion.workflow.hubspotId !== workflowId) {
      throw new NotFoundException(
        'Version does not belong to the specified workflow.',
      );
    }

    const { workflow } = workflowVersion;
    const { owner } = workflow;

    if (!owner.hubspotAccessToken) {
      throw new NotFoundException(
        'HubSpot access token not found for the workflow owner.',
      );
    }

    await this.hubspotService.updateWorkflow(
      owner.hubspotAccessToken,
      workflow.hubspotId,
      workflowVersion.data as unknown as UpdateWorkflowPayload,
    );

    const auditLog: CreateAuditLogDto = {
      action: 'rollback_workflow',
      entityType: 'workflow',
      entityId: workflow.id,
      newValue: {
        versionId: workflowVersion.id,
        versionNumber: workflowVersion.versionNumber,
      },
      userId: owner.id,
    };
    await this.auditLogService.create(auditLog);
  }
}
