import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserService } from '../user/user.service';
import { PrismaService } from '../prisma/prisma.service';

export const PLAN_FEATURE_KEY = 'planFeature';
export const PlanFeature = (feature: string) =>
  SetMetadata(PLAN_FEATURE_KEY, feature);

@Injectable()
export class PlanFeatureGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private userService: UserService,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredFeature = this.reflector.getAllAndOverride<string>(
      PLAN_FEATURE_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!requiredFeature) {
      return true;
    }
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const planId = user?.subscription?.planId || 'trial';
    const plan =
      (await this.userService.getPlanById(planId)) ||
      (await this.userService.getPlanById('trial'));
    if (!plan?.features?.includes(requiredFeature)) {
      throw new ForbiddenException(
        `Your plan does not include access to this feature: ${requiredFeature}`,
      );
    }
    return true;
  }
}

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>('roles', [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles) {
      return true;
    }
    const { user } = context.switchToHttp().getRequest();
    return requiredRoles.includes(user?.role);
  }
}
