import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  HttpException,
  HttpStatus,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { WorkflowVersionService } from './workflow-version.service';
import { CreateWorkflowVersionDto } from './dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Request } from 'express';
import { ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';

@Controller('workflow-versions')
export class WorkflowVersionController {
  constructor(
    private readonly workflowVersionService: WorkflowVersionService,
  ) {}

  @Post()
  async create(@Body() createWorkflowVersionDto: CreateWorkflowVersionDto) {
    try {
      return await this.workflowVersionService.create(createWorkflowVersionDto);
    } catch (error) {
      console.error('Failed to create workflow version:', error);
      throw new HttpException(
        'Failed to create workflow version',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
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
  @ApiOperation({ summary: 'Get a workflow version by ID' })
  @ApiParam({ name: 'id', type: String, description: 'Workflow Version ID' })
  @ApiResponse({ status: 200, description: 'Workflow version found.' })
  @ApiResponse({ status: 404, description: 'Workflow version not found.' })
  async findOne(@Param('id') id: string) {
    const version = await this.workflowVersionService.findOne(id);
    if (!version) {
      throw new HttpException(
        'Workflow version not found',
        HttpStatus.NOT_FOUND,
      );
    }
    return version;
  }

  @Get('workflow/:workflowId/latest')
  @ApiOperation({ summary: 'Get latest workflow version by workflow ID' })
  @ApiParam({ name: 'workflowId', type: String, description: 'Workflow ID' })
  @ApiResponse({ status: 200, description: 'Latest workflow version found.' })
  @ApiResponse({ status: 404, description: 'Workflow version not found.' })
  async findLatestByWorkflowId(@Param('workflowId') workflowId: string) {
    const version =
      await this.workflowVersionService.findLatestByWorkflowId(workflowId);
    if (!version) {
      throw new HttpException(
        'No versions found for this workflow',
        HttpStatus.NOT_FOUND,
      );
    }
    return version;
  }

  @Get('workflow/:workflowId/history')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get workflow version history by workflow ID' })
  @ApiParam({ name: 'workflowId', type: String, description: 'Workflow ID' })
  @ApiResponse({ status: 200, description: 'Workflow version history found.' })
  @ApiResponse({ status: 404, description: 'Workflow version not found.' })
  async getWorkflowHistory(
    @Req() req: Request,
    @Param('workflowId') workflowId: string,
  ) {
    const userId = (req as any).user?.sub;
    if (!userId)
      throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
    return await this.workflowVersionService.findByWorkflowIdWithHistoryLimit(
      workflowId,
      userId,
    );
  }

  @Get('compare/:version1Id/:version2Id')
  @ApiOperation({ summary: 'Compare two workflow versions' })
  @ApiParam({ name: 'version1Id', type: String, description: 'First Workflow Version ID' })
  @ApiParam({ name: 'version2Id', type: String, description: 'Second Workflow Version ID' })
  @ApiResponse({ status: 200, description: 'Comparison result.' })
  @ApiResponse({ status: 404, description: 'Workflow version not found.' })
  async compareVersions(
    @Param('version1Id') version1Id: string,
    @Param('version2Id') version2Id: string,
  ) {
    try {
      const version1 = await this.workflowVersionService.findOne(version1Id);
      const version2 = await this.workflowVersionService.findOne(version2Id);

      if (!version1 || !version2) {
        throw new HttpException(
          'One or both versions not found',
          HttpStatus.NOT_FOUND,
        );
      }

      // Basic comparison - in a real app, you'd implement more sophisticated diff logic
      return {
        version1,
        version2,
        differences: {
          // This would contain the actual diff logic
          hasChanges:
            JSON.stringify(version1.data) !== JSON.stringify(version2.data),
          // Add more detailed diff information here
        },
      };
    } catch (error) {
      console.error('Failed to compare versions:', error);
      throw new HttpException(
        'Failed to compare versions',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a workflow version by ID' })
  @ApiParam({ name: 'id', type: String, description: 'Workflow Version ID' })
  @ApiResponse({ status: 200, description: 'Workflow version deleted.' })
  @ApiResponse({ status: 404, description: 'Workflow version not found.' })
  async remove(@Param('id') id: string) {
    try {
      const version = await this.workflowVersionService.remove(id);
      if (!version) {
        throw new HttpException(
          'Workflow version not found',
          HttpStatus.NOT_FOUND,
        );
      }
      return { message: 'Workflow version deleted successfully' };
    } catch (error) {
      console.error('Failed to delete workflow version:', error);
      throw new HttpException(
        'Failed to delete workflow version',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
