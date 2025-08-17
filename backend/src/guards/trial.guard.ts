import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { SubscriptionService } from '../subscription/subscription.service';

@Injectable()
export class TrialGuard implements CanActivate {
  constructor(private subscriptionService: SubscriptionService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new HttpException(
        'Authentication required',
        HttpStatus.UNAUTHORIZED,
      );
    }

    const userId = user.sub || user.id || user.userId;
    if (!userId) {
      throw new HttpException('User ID not found', HttpStatus.UNAUTHORIZED);
    }

    try {
      // Check trial status
      const trialStatus = await this.subscriptionService.getTrialStatus(userId);

      // If trial has expired, block access
      if (trialStatus.isTrialExpired) {
        throw new HttpException(
          'Trial expired. Please upgrade your subscription to continue using WorkflowGuard.',
          HttpStatus.FORBIDDEN,
        );
      }

      return true;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      console.error('Trial guard error:', error);
      throw new HttpException(
        'Failed to verify trial status',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
