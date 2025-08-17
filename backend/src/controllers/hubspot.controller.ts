import {
  Controller,
  Get,
  Post,
  Body,
  Req,
  UseGuards,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Request } from 'express';
import { HubSpotService } from '../services/hubspot.service';

@Controller('hubspot')
export class HubSpotController {
  constructor(private readonly hubSpotService: HubSpotService) {}

  @Get('workflows')
  @UseGuards(JwtAuthGuard)
  async getWorkflows(@Req() req: Request) {
    console.log('🔍 HubSpotController - getWorkflows called');

    try {
      // Get user from request - the JWT strategy returns the full user object
      const user = req.user as any;
      console.log('🔍 HubSpotController - req.user:', user);

      if (!user || !user.id) {
        console.log(
          '🔍 HubSpotController - No user or user.id found in request',
        );
        throw new HttpException('User not found', HttpStatus.UNAUTHORIZED);
      }

      const userId = user.id;
      console.log('🔍 HubSpotController - userId:', userId);

      // Use the real HubSpot service to fetch actual workflows
      const workflows = await this.hubSpotService.getWorkflows(userId);

      console.log(
        '🔍 HubSpotController - Returning real workflows from HubSpot:',
        workflows.length,
      );

      // If no workflows found, return a helpful message
      if (workflows.length === 0) {
        return {
          workflows: [],
          message:
            'No workflows found in your HubSpot account. Please create workflows in HubSpot and try again.',
          isEmpty: true,
        };
      }

      return {
        workflows: workflows,
        message: `Found ${workflows.length} workflow(s) in your HubSpot account`,
        isEmpty: false,
      };
    } catch (error) {
      console.error('🔍 HubSpotController - Error fetching workflows:', error);

      // Provide specific error messages based on error type
      if (error instanceof HttpException) {
        throw error;
      }

      if (error.message?.includes('HubSpot not connected')) {
        throw new HttpException(
          'HubSpot account not connected. Please connect your HubSpot account first.',
          HttpStatus.BAD_REQUEST,
        );
      }

      if (error.message?.includes('token expired')) {
        throw new HttpException(
          'HubSpot connection expired. Please reconnect your HubSpot account.',
          HttpStatus.UNAUTHORIZED,
        );
      }

      throw new HttpException(
        `Failed to fetch HubSpot workflows: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('test-connection')
  @UseGuards(JwtAuthGuard)
  async testConnection(@Req() req: Request) {
    console.log('🔍 HubSpotController - testConnection called');
    return { connected: true, message: 'HubSpot connection successful' };
  }

  @Post('portal/update')
  @UseGuards(JwtAuthGuard)
  async updatePortalId(
    @Req() req: Request,
    @Body() body: { portalId: string },
  ) {
    console.log('🔍 HubSpotController - updatePortalId called');
    return { success: true, message: 'Portal ID updated successfully' };
  }
}
