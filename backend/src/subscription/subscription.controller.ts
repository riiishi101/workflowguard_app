import {
  Controller,
  Get,
  UseGuards,
  Req,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { SubscriptionService } from './subscription.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RequestWithUser } from '../types/auth.types';

@Controller('subscription')
export class SubscriptionController {
  constructor(private readonly subscriptionService: SubscriptionService) {}

  private getUserId(req: RequestWithUser): string {
    const userId = req.user?.sub || req.user?.id || req.user?.userId;
    if (!userId) {
      throw new HttpException('User ID not found in token', HttpStatus.UNAUTHORIZED);
    }
    return userId;
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  async getSubscription(@Req() req: RequestWithUser) {
    try {
      const userId = this.getUserId(req);
      const subscription =
        await this.subscriptionService.getUserSubscription(userId);
      return {
        success: true,
        data: subscription,
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new HttpException(
        `Failed to get subscription: ${errorMessage}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('trial-status')
  @UseGuards(JwtAuthGuard)
  async getTrialStatus(@Req() req: RequestWithUser) {
    try {
      const userId = this.getUserId(req);
      const trialStatus = await this.subscriptionService.getTrialStatus(userId);

      return {
        success: true,
        data: trialStatus,
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new HttpException(
        `Failed to get trial status: ${errorMessage}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('expiration-status')
  @UseGuards(JwtAuthGuard)
  async getExpirationStatus(@Req() req: RequestWithUser) {
    try {
      const userId = this.getUserId(req);
      const expirationStatus =
        await this.subscriptionService.checkSubscriptionExpiration(userId);

      return {
        success: true,
        data: expirationStatus,
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new HttpException(
        `Failed to get expiration status: ${errorMessage}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('next-payment')
  @UseGuards(JwtAuthGuard)
  async getNextPaymentInfo(@Req() req: RequestWithUser) {
    try {
      const userId = this.getUserId(req);
      const paymentInfo =
        await this.subscriptionService.getNextPaymentInfo(userId);

      return {
        success: true,
        data: paymentInfo,
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new HttpException(
        `Failed to get payment info: ${errorMessage}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('usage')
  @UseGuards(JwtAuthGuard)
  async getUsageStats(@Req() req: RequestWithUser) {
    try {
      const userId = this.getUserId(req);
      const usageStats = await this.subscriptionService.getUsageStats(userId);
      return {
        success: true,
        data: usageStats,
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new HttpException(
        `Failed to get usage stats: ${errorMessage}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
