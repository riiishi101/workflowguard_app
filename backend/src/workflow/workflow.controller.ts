import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpException,
  HttpStatus,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { WorkflowService } from './workflow.service';
import { CreateWorkflowDto, UpdateWorkflowDto } from './dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Request } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';

@ApiTags('Workflows')
@ApiBearerAuth()
@Controller('workflows')
export class WorkflowController {
  constructor(private readonly workflowService: WorkflowService) {}

  // Utility to deeply convert objects to JSON-serializable form
  private toSerializable(obj: any): any {
    if (Array.isArray(obj)) {
      return obj.map((item) => this.toSerializable(item));
    } else if (obj && typeof obj === 'object') {
      const plain: any = {};
      for (const key of Object.keys(obj)) {
        const value = obj[key];
        // Remove undefined, functions, and symbols
        if (typeof value !== 'function' && typeof value !== 'symbol') {
          plain[key] = this.toSerializable(value);
        }
      }
      return plain;
    }
    return obj;
  }

  @Post()
  @ApiOperation({ summary: 'Create a new workflow' })
  @ApiResponse({ status: 201, description: 'Workflow created successfully.' })
  @ApiResponse({ status: 500, description: 'Failed to create workflow.' })
  async create(@Body() createWorkflowDto: CreateWorkflowDto) {
    try {
      return await this.workflowService.create(createWorkflowDto);
    } catch (error) {
      console.error('Failed to create workflow:', error);
      throw new HttpException(
        'Failed to create workflow',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  @ApiOperation({ summary: 'Get all workflows' })
  @ApiResponse({ status: 200, description: 'List of workflows.' })
  async findAll(
    @Req() req: Request,
    @Query('ownerId') ownerId?: string,
    @Query('live') live?: string,
  ) {
    const userId = (req as any).user?.id || (req as any).user?.sub;
    console.log('WORKFLOW CONTROLLER: live param is', live, 'userId is', userId);
    if (live === 'true' && userId) {
      // Fetch live workflows from HubSpot for the current user
      const workflows = await this.workflowService.getWorkflowsFromHubSpot(userId);
      return this.toSerializable(workflows);
    }
    if (ownerId) {
      // Filter by owner if provided
      const workflows = await this.workflowService.findAll();
      return this.toSerializable(workflows.filter((w) => w.ownerId === ownerId));
    }
    const workflows = await this.workflowService.findAll();
    return this.toSerializable(workflows);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a workflow by ID' })
  @ApiParam({ name: 'id', type: String, description: 'Workflow ID' })
  @ApiResponse({ status: 200, description: 'Workflow found.' })
  @ApiResponse({ status: 404, description: 'Workflow not found.' })
  async findOne(@Param('id') id: string) {
    const workflow = await this.workflowService.findOne(id);
    if (!workflow) {
      throw new HttpException('Workflow not found', HttpStatus.NOT_FOUND);
    }
    return workflow;
  }

  @Get('hubspot/:hubspotId')
  @ApiOperation({ summary: 'Get a workflow by HubSpot ID' })
  @ApiParam({ name: 'hubspotId', type: String, description: 'HubSpot Workflow ID' })
  @ApiResponse({ status: 200, description: 'Workflow found.' })
  @ApiResponse({ status: 404, description: 'Workflow not found.' })
  async findByHubspotId(@Param('hubspotId') hubspotId: string) {
    const workflow = await this.workflowService.findByHubspotId(hubspotId);
    if (!workflow) {
      throw new HttpException('Workflow not found', HttpStatus.NOT_FOUND);
    }
    return workflow;
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Update a workflow' })
  @ApiParam({ name: 'id', type: String, description: 'Workflow ID' })
  @ApiResponse({ status: 200, description: 'Workflow updated.' })
  @ApiResponse({ status: 404, description: 'Workflow not found.' })
  @ApiResponse({ status: 500, description: 'Failed to update workflow.' })
  async update(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() updateWorkflowDto: UpdateWorkflowDto,
  ) {
    try {
      const userId = (req as any).user?.sub;
      const workflow = await this.workflowService.update(id, {
        ...updateWorkflowDto,
        updatedBy: userId,
      });
      if (!workflow) {
        throw new HttpException('Workflow not found', HttpStatus.NOT_FOUND);
      }
      return workflow;
    } catch (error) {
      console.error('Failed to update workflow:', error);
      throw new HttpException(
        'Failed to update workflow',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Delete a workflow' })
  @ApiParam({ name: 'id', type: String, description: 'Workflow ID' })
  @ApiResponse({ status: 200, description: 'Workflow deleted successfully.' })
  @ApiResponse({ status: 404, description: 'Workflow not found.' })
  @ApiResponse({ status: 500, description: 'Failed to delete workflow.' })
  async remove(@Req() req: Request, @Param('id') id: string) {
    try {
      const userId = (req as any).user?.sub;
      const workflow = await this.workflowService.remove(id, userId);
      if (!workflow) {
        throw new HttpException('Workflow not found', HttpStatus.NOT_FOUND);
      }
      return { message: 'Workflow deleted successfully' };
    } catch (error) {
      console.error('Failed to delete workflow:', error);
      throw new HttpException(
        'Failed to delete workflow',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/sync-from-hubspot')
  @ApiOperation({ summary: 'Sync workflow from HubSpot' })
  @ApiParam({ name: 'id', type: String, description: 'Workflow ID' })
  @ApiResponse({ status: 200, description: 'Workflow synced from HubSpot.' })
  async syncFromHubSpot(@Req() req: Request, @Param('id') id: string) {
    const userId = (req as any).user?.sub;
    return this.workflowService.snapshotFromHubSpot(id, userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/rollback')
  @ApiParam({ name: 'id', type: String, description: 'Workflow ID' })
  async rollback(@Req() req: Request, @Param('id') id: string) {
    try {
      const userId = (req as any).user?.sub;
      await this.workflowService.rollback(id, userId);
      return { message: 'Workflow rolled back successfully' };
    } catch (error) {
      console.error('Failed to rollback workflow:', error);
      throw new HttpException(
        'Failed to rollback workflow',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // @UseGuards(JwtAuthGuard)
  @Post('monitored')
  async setMonitoredWorkflows(@Req() req: Request, @Body() body: { workflowIds: string[] }) {
    console.log('[setMonitoredWorkflows] Request received with body:', body);
    console.log('[setMonitoredWorkflows] Request headers:', req.headers);
    console.log('[setMonitoredWorkflows] Request cookies:', req.cookies);
    
    // Temporarily get user from JWT cookie directly for testing
    let userId = (req as any).user?.sub;
    if (!userId && req.cookies?.jwt) {
      try {
        const jwt = require('jsonwebtoken');
        const payload = jwt.verify(req.cookies.jwt, process.env.JWT_SECRET || 'supersecretkey');
        userId = payload.sub;
        console.log('[setMonitoredWorkflows] Extracted userId from JWT:', userId);
      } catch (error) {
        console.log('[setMonitoredWorkflows] JWT verification failed:', error.message);
      }
    }
    
    if (!userId) {
      console.log('[setMonitoredWorkflows] No userId found, returning 401');
      throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
    }
    if (!body || !Array.isArray(body.workflowIds)) {
      throw new HttpException('Invalid payload', HttpStatus.BAD_REQUEST);
    }
    
    try {
      // Save monitored workflows for the user
      const result = await this.workflowService.setMonitoredWorkflows(userId, body.workflowIds);
    console.log(`[setMonitoredWorkflows] User ${userId} selected workflows:`, body.workflowIds);
      return result;
    } catch (error) {
      console.error('[setMonitoredWorkflows] Error saving monitored workflows:', error);
      throw new HttpException('Failed to save monitored workflows', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('sync-status/:id?')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get workflow sync status' })
  @ApiResponse({ status: 200, description: 'Sync status retrieved successfully.' })
  async getSyncStatus(@Param('id') workflowId?: string, @Req() req?: Request) {
    const userId = (req as any).user?.id || (req as any).user?.sub;
    if (workflowId) {
      return await this.workflowService.getWorkflowSyncStatus(workflowId, userId);
    }
    return await this.workflowService.getAllWorkflowSyncStatus(userId);
  }

  @Post('compare-versions')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Compare two workflow versions' })
  @ApiResponse({ status: 200, description: 'Version comparison completed.' })
  async compareVersions(
    @Body() body: { version1Id: string; version2Id: string },
    @Req() req: Request,
  ) {
    const userId = (req as any).user?.id || (req as any).user?.sub;
    return await this.workflowService.compareVersions(body.version1Id, body.version2Id, userId);
  }

  @Post(':id/backup')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Create a workflow backup' })
  @ApiResponse({ status: 201, description: 'Backup created successfully.' })
  async createBackup(
    @Param('id') workflowId: string,
    @Body() body: { description?: string },
    @Req() req: Request,
  ) {
    const userId = (req as any).user?.id || (req as any).user?.sub;
    return await this.workflowService.createBackup(workflowId, userId, body.description);
  }

  @Post(':id/restore')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Restore workflow from backup' })
  @ApiResponse({ status: 200, description: 'Workflow restored successfully.' })
  async restoreFromBackup(
    @Param('id') workflowId: string,
    @Body() body: { backupId: string },
    @Req() req: Request,
  ) {
    const userId = (req as any).user?.id || (req as any).user?.sub;
    return await this.workflowService.restoreFromBackup(workflowId, body.backupId, userId);
  }

  @Patch(':id/monitoring-settings')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Update workflow monitoring settings' })
  @ApiResponse({ status: 200, description: 'Settings updated successfully.' })
  async updateMonitoringSettings(
    @Param('id') workflowId: string,
    @Body() body: { autoSync: boolean; syncInterval: number; notificationsEnabled: boolean },
    @Req() req: Request,
  ) {
    const userId = (req as any).user?.id || (req as any).user?.sub;
    return await this.workflowService.updateMonitoringSettings(workflowId, userId, body);
  }
}
