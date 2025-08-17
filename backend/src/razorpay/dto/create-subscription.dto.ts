import { IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { PlanId } from '../../plan-config';

export class CreateSubscriptionDto {
  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsString()
  @IsNotEmpty()
  @IsIn(['starter', 'professional', 'enterprise'])
  planId: PlanId;

  @IsString()
  @IsOptional()
  currency? = 'USD';
}
