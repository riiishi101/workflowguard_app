import {
  IsEmail,
  IsString,
  IsOptional,
  IsIn,
  IsBoolean,
} from 'class-validator';

export class UpdateUserDto {
  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsIn(['admin', 'viewer'])
  @IsOptional()
  role?: string;

  @IsString()
  @IsOptional()
  jobTitle?: string;

  @IsString()
  @IsOptional()
  timezone?: string;

  @IsString()
  @IsOptional()
  language?: string;
}

export class UpdateNotificationSettingsDto {
  @IsBoolean()
  notificationsEnabled: boolean;

  @IsEmail()
  notificationEmail: string;

  @IsBoolean()
  workflowDeleted: boolean;

  @IsBoolean()
  enrollmentTriggerModified: boolean;

  @IsBoolean()
  workflowRolledBack: boolean;

  @IsBoolean()
  criticalActionModified: boolean;
}
