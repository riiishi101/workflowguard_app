import { Controller, Get, Post, Body, Patch, Param, Delete, HttpException, HttpStatus, Query, Req, UseGuards } from '@nestjs/common';
import { WorkflowService } from './workflow.service';
import { CreateWorkflowDto, UpdateWorkflowDto } from './dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Request } from 'express';

@Controller('workflows')
export class WorkflowController {
  constructor(private readonly workflowService: WorkflowService) {}

  @Post()
  async create(@Body() createWorkflowDto: CreateWorkflowDto) {
    try {
      return await this.workflowService.create(createWorkflowDto);
    } catch (error) {
      throw new HttpException('Failed to create workflow', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get()
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
  async findOne(@Param('id') id: string) {
    const workflow = await this.workflowService.findOne(id);
    if (!workflow) {
      throw new HttpException('Workflow not found', HttpStatus.NOT_FOUND);
    }
    return workflow;
  }

  @Get('hubspot/:hubspotId')
  async findByHubspotId(@Param('hubspotId') hubspotId: string) {
    const workflow = await this.workflowService.findByHubspotId(hubspotId);
    if (!workflow) {
      throw new HttpException('Workflow not found', HttpStatus.NOT_FOUND);
    }
    return workflow;
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
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
