import { IsBoolean, IsEmail, IsOptional } from 'class-validator';

export class UpdateNotificationSettingsDto {
  @IsBoolean()
  @IsOptional()
  enabled?: boolean;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsBoolean()
  @IsOptional()
  workflowDeleted?: boolean;

  @IsBoolean()
  @IsOptional()
  enrollmentTriggerModified?: boolean;

  @IsBoolean()
  @IsOptional()
  workflowRolledBack?: boolean;

  @IsBoolean()
  @IsOptional()
  criticalActionModified?: boolean;
}
