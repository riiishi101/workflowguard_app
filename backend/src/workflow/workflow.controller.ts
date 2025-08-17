import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
  HttpException,
  HttpStatus,
  Query,
} from '@nestjs/common';
import { WorkflowService } from './workflow.service';
import {
  CreateWorkflowDto,
  UpdateWorkflowDto,
  StartWorkflowProtectionDto,
  CreateChangeNotificationDto,
  CreateApprovalRequestDto,
  WorkflowDetails,
  HubSpotWorkflow,
  ProtectedWorkflowDetailsDto,
  ProtectedWorkflowDto,
  WorkflowStatsDto,
} from './dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { TrialGuard } from '../guards/trial.guard';
import { RequestWithUser } from '../types/request-with-user.interface';

@Controller('workflow')
export class WorkflowController {
  constructor(private readonly workflowService: WorkflowService) {}

  private getUserId(req: RequestWithUser): string {
    const userId = req.user?.sub || req.user?.id || req.user?.userId;
    if (!userId) {
      throw new HttpException('User ID not found', HttpStatus.UNAUTHORIZED);
    }
    return userId;
  }

  @Post()
  create(@Body() createWorkflowDto: CreateWorkflowDto) {
    return this.workflowService.create(createWorkflowDto);
  }

  @Get()
  findAll() {
    return this.workflowService.findAll();
  }

  @Get('by-hubspot-id/:hubspotId')
  @UseGuards(JwtAuthGuard, TrialGuard)
  async findByHubspotId(
    @Param('hubspotId') hubspotId: string,
    @Req() req: RequestWithUser,
  ) {
    const userId = this.getUserId(req);
    try {
      const workflow: WorkflowDetails = await this.workflowService.findByHubspotId(
        hubspotId,
        userId,
      );
      return {
        success: true,
        data: workflow,
        message: 'Workflow found successfully',
      };
    } catch (error) {
      console.error('Failed to find workflow by HubSpot ID:', error);
      throw new HttpException(
        'Workflow not found or access denied',
        HttpStatus.NOT_FOUND,
      );
    }
  }

  @Get('hubspot/:hubspotId')
  async findByHubspotIdLegacy(@Param('hubspotId') hubspotId: string) {
    return {
      message: 'HubSpot workflow lookup not implemented in simplified version',
    };
  }

  @Get('hubspot')
  @UseGuards(JwtAuthGuard, TrialGuard)
  async getHubSpotWorkflows(@Req() req: RequestWithUser) {
    const userId = this.getUserId(req);
    try {
      const workflows: HubSpotWorkflow[] = await this.workflowService.getHubSpotWorkflows(userId);
      return {
        success: true,
        data: workflows,
        message: `Successfully fetched ${workflows.length} workflows from HubSpot`,
      };
    } catch (error) {
      console.error('Failed to fetch HubSpot workflows:', error);
      throw new HttpException(
        `Failed to fetch HubSpot workflows: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('protected')
  @UseGuards(JwtAuthGuard, TrialGuard)
  async getProtectedWorkflows(@Req() req: RequestWithUser) {
    const userId = this.getUserId(req);
    try {
      const workflows: ProtectedWorkflowDetailsDto[] =
        await this.workflowService.getProtectedWorkflows(userId);
      return {
        success: true,
        data: workflows,
        message: `Successfully fetched ${workflows.length} protected workflows`,
      };
    } catch (error) {
      console.error('Failed to fetch protected workflows:', error);
      throw new HttpException(
        `Failed to fetch protected workflows: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('sync-hubspot')
  @UseGuards(JwtAuthGuard, TrialGuard)
  async syncHubSpotWorkflows(@Req() req: RequestWithUser) {
    const userId = this.getUserId(req);
    try {
      const workflows: ProtectedWorkflowDto[] = await this.workflowService.syncHubSpotWorkflows(userId);
      return {
        success: true,
        data: workflows,
        message: `Successfully synced ${workflows.length} workflows from HubSpot`,
      };
    } catch (error) {
      console.error('Failed to sync HubSpot workflows:', error);
      throw new HttpException(
        `Failed to sync HubSpot workflows: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post(':id/automated-backup')
  @UseGuards(JwtAuthGuard, TrialGuard)
  async createAutomatedBackup(
    @Param('id') workflowId: string,
    @Req() req: RequestWithUser,
  ) {
    const userId = this.getUserId(req);
    try {
      const backup = await this.workflowService.createAutomatedBackup(
        workflowId,
        userId,
      );
      return {
        message: 'Automated backup created successfully',
        backup: backup,
      };
    } catch (error) {
      throw new HttpException(
        `Failed to create automated backup: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post(':id/change-notification')
  @UseGuards(JwtAuthGuard, TrialGuard)
  async createChangeNotification(
    @Param('id') workflowId: string,
    @Body() changeDto: CreateChangeNotificationDto,
    @Req() req: RequestWithUser,
  ) {
    const userId = this.getUserId(req);
    try {
      await this.workflowService.createChangeNotification(
        workflowId,
        userId,
        changeDto.changes,
      );
      return {
        message: 'Change notification created successfully',
      };
    } catch (error) {
      throw new HttpException(
        `Failed to create change notification: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post(':id/approval-request')
  @UseGuards(JwtAuthGuard, TrialGuard)
  async createApprovalRequest(
    @Param('id') workflowId: string,
    @Body() approvalDto: CreateApprovalRequestDto,
    @Req() req: RequestWithUser,
  ) {
    const userId = this.getUserId(req);
    try {
      const approvalRequest = await this.workflowService.createApprovalRequest(
        workflowId,
        userId,
        approvalDto.requestedChanges,
      );
      return {
        message: 'Approval request created successfully',
        approvalRequest: approvalRequest,
      };
    } catch (error) {
      throw new HttpException(
        `Failed to create approval request: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(':id/compliance-report')
  @UseGuards(JwtAuthGuard, TrialGuard)
  async generateComplianceReport(
    @Param('id') workflowId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    try {
      const start = new Date(startDate);
      const end = new Date(endDate);

      const report = await this.workflowService.generateComplianceReport(
        workflowId,
        start,
        end,
      );
      return report;
    } catch (error) {
      throw new HttpException(
        `Failed to generate compliance report: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, TrialGuard)
  async findOne(@Param('id') id: string, @Req() req: RequestWithUser) {
    const userId = this.getUserId(req);
    try {
      const workflow: WorkflowDetails = await this.workflowService.findOne(id, userId);
      return {
        success: true,
        data: workflow,
        message: 'Workflow found successfully',
      };
    } catch (error) {
      console.error('Failed to find workflow:', error);
      throw new HttpException(
        'Workflow not found or access denied',
        HttpStatus.NOT_FOUND,
      );
    }
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateWorkflowDto: UpdateWorkflowDto,
  ) {
    return this.workflowService.update(id, updateWorkflowDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.workflowService.remove(id);
  }

  @Post(':id/rollback/:versionId')
  @UseGuards(JwtAuthGuard, TrialGuard)
  async restoreWorkflowVersion(
    @Param('id') workflowId: string,
    @Param('versionId') versionId: string,
    @Req() req: RequestWithUser,
  ) {
    const userId = this.getUserId(req);
    try {
      const result = await this.workflowService.restoreWorkflowVersion(
        workflowId,
        versionId,
        userId,
      );
      return {
        message: 'Workflow restored successfully',
        result: result,
      };
    } catch (error) {
      throw new HttpException(
        `Failed to restore workflow: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post(':id/rollback')
  @UseGuards(JwtAuthGuard, TrialGuard)
  async rollbackWorkflow(
    @Param('id') workflowId: string,
    @Req() req: RequestWithUser,
  ) {
    const userId = this.getUserId(req);
    try {
      const result = await this.workflowService.rollbackWorkflow(
        workflowId,
        userId,
      );
      return {
        message: 'Workflow rolled back successfully',
        result: result,
      };
    } catch (error) {
      throw new HttpException(
        `Failed to rollback workflow: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(':id/version/:versionId/download')
  @UseGuards(JwtAuthGuard, TrialGuard)
  async downloadWorkflowVersion(
    @Param('id') workflowId: string,
    @Param('versionId') versionId: string,
  ) {
    try {
      const versionData = await this.workflowService.downloadWorkflowVersion(
        workflowId,
        versionId,
      );
      return versionData;
    } catch (error) {
      throw new HttpException(
        `Failed to download workflow version: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('start-protection')
  @UseGuards(JwtAuthGuard, TrialGuard)
  async startWorkflowProtection(
    @Body() body: StartWorkflowProtectionDto,
    @Req() req: RequestWithUser,
  ) {
    const userId = this.getUserId(req);
    try {
      const result: ProtectedWorkflowDto[] = await this.workflowService.startWorkflowProtection(
        body.workflows.map((w) => w.id),
        userId,
        body.workflows,
      );
      return {
        success: true,
        message: 'Workflow protection started successfully',
        data: result,
      };
    } catch (error) {
      console.error('start-protection error:', error);
      throw new HttpException(
        `Failed to start workflow protection: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('stats')
  @UseGuards(JwtAuthGuard, TrialGuard)
  async getWorkflowStats(@Req() req: RequestWithUser) {
    const userId = this.getUserId(req);
    try {
      const stats: WorkflowStatsDto[] = await this.workflowService.getWorkflowStats(userId);
      return stats;
    } catch (error) {
      throw new HttpException(
        `Failed to get workflow stats: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
