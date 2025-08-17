import {
  Controller,
  Get,
  Req,
  HttpException,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { WorkflowService } from '../workflow/workflow.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { TrialGuard } from '../guards/trial.guard';

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly workflowService: WorkflowService) {}

  @UseGuards(JwtAuthGuard, TrialGuard)
  @Get('stats')
  async getDashboardStats(@Req() req: Request) {
    try {
      // Use the same robust user ID extraction as workflow controller
      let userId =
        (req.user as any)?.sub ||
        (req.user as any)?.id ||
        (req.user as any)?.userId;

      if (!userId) {
        userId = req.headers['x-user-id'];
      }

      if (!userId) {
        console.log(
          'DashboardController - No userId found in dashboard stats request',
        );
        // Return basic stats instead of throwing error
        return {
          totalWorkflows: 0,
          activeWorkflows: 0,
          protectedWorkflows: 0,
          totalVersions: 0,
          uptime: 0,
          lastSnapshot: new Date().toISOString(),
          planCapacity: 100,
          planUsed: 0,
        };
      }

      console.log('DashboardController - Getting stats for userId:', userId);

      // Get real stats from workflow service
      const stats = await this.workflowService.getDashboardStats(userId);

      console.log('DashboardController - Returning stats:', stats);
      return stats;
    } catch (error) {
      console.error('DashboardController - Error getting stats:', error);
      if (error instanceof HttpException) {
        throw error;
      }
      // Return basic stats instead of throwing error
      return {
        totalWorkflows: 0,
        activeWorkflows: 0,
        protectedWorkflows: 0,
        totalVersions: 0,
        uptime: 0,
        lastSnapshot: new Date().toISOString(),
        planCapacity: 100,
        planUsed: 0,
      };
    }
  }
}
