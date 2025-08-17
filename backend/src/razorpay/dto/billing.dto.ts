import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsIn } from 'class-validator';

export class CreateSubscriptionDto {
  @IsString()
  @IsNotEmpty()
  @IsIn(['starter', 'professional', 'enterprise'])
  planId: string;

  @IsString()
  @IsOptional()
  @IsIn(['USD', 'INR', 'EUR', 'GBP', 'AUD', 'CAD'])
  currency?: string = 'USD';

  @IsString()
  @IsOptional()
  paymentMethodId?: string;
}

export class UpgradeSubscriptionDto {
  @IsString()
  @IsNotEmpty()
  @IsIn(['starter', 'professional', 'enterprise'])
  newPlanId: string;

  @IsString()
  @IsOptional()
  @IsIn(['USD', 'INR', 'EUR', 'GBP', 'AUD', 'CAD'])
  currency?: string = 'USD';
}

export class CancelSubscriptionDto {
  @IsBoolean()
  @IsOptional()
  immediate?: boolean = false;
}

export class UpdatePaymentMethodDto {
  @IsString()
  @IsNotEmpty()
  paymentMethodId: string;
}

export class ConfirmPaymentDto {
  @IsString()
  @IsNotEmpty()
  razorpay_payment_id: string;

  @IsString()
  @IsNotEmpty()
  razorpay_order_id: string;

  @IsString()
  @IsNotEmpty()
  razorpay_signature: string;

  @IsString()
  @IsOptional()
  planId?: string;

  @IsString()
  @IsOptional()
  type?: string; // 'subscription' | 'upgrade' | 'payment_method'
}
