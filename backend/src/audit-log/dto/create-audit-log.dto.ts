import { IsString, IsNotEmpty, IsOptional, IsObject } from 'class-validator';

export class CreateAuditLogDto {
  @IsString()
  @IsOptional()
  userId?: string;

  @IsString()
  @IsNotEmpty()
  action: string; // 'restore', 'create', 'update', 'delete'

  @IsString()
  @IsNotEmpty()
  entityType: string; // 'workflow', 'version', 'settings'

  @IsString()
  @IsNotEmpty()
  entityId: string; // ID of the affected entity

  @IsObject()
  @IsOptional()
  oldValue?: any;

  @IsObject()
  @IsOptional()
  newValue?: any;

  @IsString()
  @IsOptional()
  ipAddress?: string;
}
