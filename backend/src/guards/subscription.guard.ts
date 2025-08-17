import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { SubscriptionService } from '../subscription/subscription.service';

@Injectable()
export class SubscriptionGuard implements CanActivate {
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
      // Get user subscription status
      const subscription =
        await this.subscriptionService.getUserSubscription(userId);

      // Check if subscription is cancelled or past due
      if (subscription.status === 'canceled') {
        throw new HttpException(
          'Subscription cancelled. Please reactivate your subscription to continue using WorkflowGuard.',
          HttpStatus.FORBIDDEN,
        );
      }

      if (subscription.status === 'past_due') {
        throw new HttpException(
          'Payment failed. Please update your payment method to continue using WorkflowGuard.',
          HttpStatus.FORBIDDEN,
        );
      }

      // Check if subscription has expired (for non-trial subscriptions)
      if (
        subscription.nextBillingDate &&
        new Date() > new Date(subscription.nextBillingDate)
      ) {
        throw new HttpException(
          'Subscription expired. Please renew your subscription to continue using WorkflowGuard.',
          HttpStatus.FORBIDDEN,
        );
      }

      return true;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      console.error('Subscription guard error:', error);
      throw new HttpException(
        'Failed to verify subscription status',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
