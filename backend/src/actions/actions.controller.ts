import {
  Controller,
  Post,
  Body,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { ActionsService } from './actions.service';

@Controller('actions')
export class ActionsController {
  constructor(private readonly actionsService: ActionsService) {}

  @Post('protect-workflow')
  async protectWorkflow(@Body() body: any) {
    try {
      const { workflow_id } = body;
      if (!workflow_id) {
        throw new HttpException(
          'Workflow ID is required',
          HttpStatus.BAD_REQUEST,
        );
      }
      await this.actionsService.protectWorkflow(workflow_id);
      return { success: true, message: 'Workflow protection initiated.' };
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post('rollback-workflow')
  async rollbackWorkflow(@Body() body: any) {
    try {
      const { workflow_id, version_id } = body;
      if (!workflow_id || !version_id) {
        throw new HttpException(
          'Workflow ID and Version ID are required',
          HttpStatus.BAD_REQUEST,
        );
      }
      await this.actionsService.rollbackWorkflow(workflow_id, version_id);
      return { success: true, message: 'Workflow rollback initiated.' };
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
