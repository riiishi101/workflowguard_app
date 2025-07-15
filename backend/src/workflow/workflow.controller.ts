import { Controller, Get, Post, Body, Patch, Param, Delete, HttpException, HttpStatus, Query, Req, UseGuards } from '@nestjs/common';
import { WorkflowService } from './workflow.service';
import { CreateWorkflowDto, UpdateWorkflowDto } from './dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Request } from 'express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Workflows')
@ApiBearerAuth()
@Controller('workflows')
export class WorkflowController {
  constructor(private readonly workflowService: WorkflowService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new workflow' })
  @ApiResponse({ status: 201, description: 'Workflow created successfully.' })
  @ApiResponse({ status: 500, description: 'Failed to create workflow.' })
  async create(@Body() createWorkflowDto: CreateWorkflowDto) {
    try {
      return await this.workflowService.create(createWorkflowDto);
    } catch (error) {
      throw new HttpException('Failed to create workflow', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  @ApiOperation({ summary: 'Get all workflows' })
  @ApiResponse({ status: 200, description: 'List of workflows.' })
  async findAll(@Req() req: Request, @Query('ownerId') ownerId?: string, @Query('live') live?: string) {
    const userId = ((req as any).user)?.sub;
    if (live === 'true' && userId) {
      // Fetch live workflows from HubSpot for the current user
      return await this.workflowService.getWorkflowsFromHubSpot(userId);
    }
    if (ownerId) {
      // Filter by owner if provided
      return await this.workflowService.findAll().then(workflows => 
        workflows.filter(w => w.ownerId === ownerId)
      );
    }
    return await this.workflowService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a workflow by ID' })
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
  @ApiResponse({ status: 200, description: 'Workflow updated.' })
  @ApiResponse({ status: 404, description: 'Workflow not found.' })
  @ApiResponse({ status: 500, description: 'Failed to update workflow.' })
  async update(@Req() req: Request, @Param('id') id: string, @Body() updateWorkflowDto: UpdateWorkflowDto) {
    try {
      const userId = ((req as any).user)?.sub;
      const workflow = await this.workflowService.update(id, { ...updateWorkflowDto, updatedBy: userId });
      if (!workflow) {
        throw new HttpException('Workflow not found', HttpStatus.NOT_FOUND);
      }
      return workflow;
    } catch (error) {
      throw new HttpException('Failed to update workflow', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Delete a workflow' })
  @ApiResponse({ status: 200, description: 'Workflow deleted successfully.' })
  @ApiResponse({ status: 404, description: 'Workflow not found.' })
  @ApiResponse({ status: 500, description: 'Failed to delete workflow.' })
  async remove(@Req() req: Request, @Param('id') id: string) {
    try {
      const userId = ((req as any).user)?.sub;
      const workflow = await this.workflowService.remove(id, userId);
      if (!workflow) {
        throw new HttpException('Workflow not found', HttpStatus.NOT_FOUND);
      }
      return { message: 'Workflow deleted successfully' };
    } catch (error) {
      throw new HttpException('Failed to delete workflow', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/sync-from-hubspot')
  @ApiOperation({ summary: 'Sync workflow from HubSpot' })
  @ApiResponse({ status: 200, description: 'Workflow synced from HubSpot.' })
  async syncFromHubSpot(@Req() req: Request, @Param('id') id: string) {
    const userId = ((req as any).user)?.sub;
    return this.workflowService.snapshotFromHubSpot(id, userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/rollback')
  async rollback(@Req() req: Request, @Param('id') id: string) {
    try {
      const userId = ((req as any).user)?.sub;
      await this.workflowService.rollback(id, userId);
      return { message: 'Workflow rolled back successfully' };
    } catch (error) {
      throw new HttpException('Failed to rollback workflow', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
