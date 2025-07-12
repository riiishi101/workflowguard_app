import { Controller, Get, Post, Body, Param, Delete, HttpException, HttpStatus, Query, Req, UseGuards } from '@nestjs/common';
import { WorkflowVersionService } from './workflow-version.service';
import { CreateWorkflowVersionDto } from './dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Request } from 'express';

@Controller('workflow-versions')
export class WorkflowVersionController {
  constructor(private readonly workflowVersionService: WorkflowVersionService) {}

  @Post()
  async create(@Body() createWorkflowVersionDto: CreateWorkflowVersionDto) {
    try {
      return await this.workflowVersionService.create(createWorkflowVersionDto);
    } catch (error) {
      throw new HttpException('Failed to create workflow version', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get()
  async findAll(@Query('workflowId') workflowId?: string) {
    if (workflowId) {
      return await this.workflowVersionService.findByWorkflowId(workflowId);
    }
    return await this.workflowVersionService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const version = await this.workflowVersionService.findOne(id);
    if (!version) {
      throw new HttpException('Workflow version not found', HttpStatus.NOT_FOUND);
    }
    return version;
  }

  @Get('workflow/:workflowId/latest')
  async findLatestByWorkflowId(@Param('workflowId') workflowId: string) {
    const version = await this.workflowVersionService.findLatestByWorkflowId(workflowId);
    if (!version) {
      throw new HttpException('No versions found for this workflow', HttpStatus.NOT_FOUND);
    }
    return version;
  }

  @Get('workflow/:workflowId/history')
  @UseGuards(JwtAuthGuard)
  async getWorkflowHistory(@Req() req: Request, @Param('workflowId') workflowId: string) {
    const userId = ((req as any).user)?.sub;
    if (!userId) throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
    return await this.workflowVersionService.findByWorkflowIdWithHistoryLimit(workflowId, userId);
  }

  @Get('compare/:version1Id/:version2Id')
  async compareVersions(@Param('version1Id') version1Id: string, @Param('version2Id') version2Id: string) {
    try {
      const version1 = await this.workflowVersionService.findOne(version1Id);
      const version2 = await this.workflowVersionService.findOne(version2Id);

      if (!version1 || !version2) {
        throw new HttpException('One or both versions not found', HttpStatus.NOT_FOUND);
      }

      // Basic comparison - in a real app, you'd implement more sophisticated diff logic
      return {
        version1,
        version2,
        differences: {
          // This would contain the actual diff logic
          hasChanges: JSON.stringify(version1.data) !== JSON.stringify(version2.data),
          // Add more detailed diff information here
        }
      };
    } catch (error) {
      throw new HttpException('Failed to compare versions', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    try {
      const version = await this.workflowVersionService.remove(id);
      if (!version) {
        throw new HttpException('Workflow version not found', HttpStatus.NOT_FOUND);
      }
      return { message: 'Workflow version deleted successfully' };
    } catch (error) {
      throw new HttpException('Failed to delete workflow version', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
