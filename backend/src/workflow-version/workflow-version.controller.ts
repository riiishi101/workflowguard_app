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
  ParseIntPipe,
} from '@nestjs/common';
import { WorkflowVersionService } from './workflow-version.service';
import {
  CreateWorkflowVersionDto,
  HubspotWorkflowHistoryDto,
  UpdateWorkflowVersionDto,
  WorkflowVersionHistoryDto,
} from './dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RequestWithUser } from '../types/request-with-user.interface';

@Controller('workflow-version')
export class WorkflowVersionController {
  constructor(
    private readonly workflowVersionService: WorkflowVersionService,
  ) {}

  private getUserIdFromRequest(req: RequestWithUser): string {
    const userId = req.user?.sub || req.user?.id || req.user?.userId;
    if (userId) {
      return userId;
    }

    const headerUserId = req.headers['x-user-id'];
    if (typeof headerUserId === 'string') {
      return headerUserId;
    }

    throw new HttpException('User ID not found', HttpStatus.UNAUTHORIZED);
  }

  @Post()
  create(@Body() createWorkflowVersionDto: CreateWorkflowVersionDto) {
    return this.workflowVersionService.create(createWorkflowVersionDto);
  }

  @Get()
  findAll() {
    return this.workflowVersionService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.workflowVersionService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateWorkflowVersionDto: UpdateWorkflowVersionDto,
  ) {
    return this.workflowVersionService.update(id, updateWorkflowVersionDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.workflowVersionService.remove(id);
  }

  @Get('by-hubspot-id/:hubspotId/history')
  @UseGuards(JwtAuthGuard)
  async getWorkflowHistoryByHubspotId(
    @Param('hubspotId') hubspotId: string,
    @Req() req: RequestWithUser,
  ) {
    const userId = this.getUserIdFromRequest(req);

    try {
      const history: HubspotWorkflowHistoryDto[] =
        await this.workflowVersionService.findByHubspotIdWithHistory(
          hubspotId,
          userId,
        );
      return {
        success: true,
        data: history,
        message: 'Workflow history retrieved successfully',
      };
    } catch (error) {
      console.error('Failed to get workflow history by HubSpot ID:', error);
      throw new HttpException(
        'Workflow history not found or access denied',
        HttpStatus.NOT_FOUND,
      );
    }
  }

  @Get(':workflowId/history')
  @UseGuards(JwtAuthGuard)
  async getWorkflowHistory(
    @Param('workflowId') workflowId: string,
    @Req() req: RequestWithUser,
    @Query('limit', new ParseIntPipe({ optional: true })) limit: number = 50,
  ) {
    const userId = this.getUserIdFromRequest(req);

    try {
      const history: WorkflowVersionHistoryDto[] =
        await this.workflowVersionService.findByWorkflowIdWithHistoryLimit(
          workflowId,
          limit,
        );
      return history;
    } catch (error) {
      throw new HttpException(
        `Failed to get workflow history: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
