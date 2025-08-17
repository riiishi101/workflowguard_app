import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
} from 'class-validator';

export class CreateWorkflowVersionDto {
  @IsString()
  @IsNotEmpty()
  workflowId: string;

  @IsNumber()
  versionNumber: number;

  @IsString()
  @IsNotEmpty()
  snapshotType: string; // 'manual', 'on-publish', 'daily-backup'

  @IsString()
  @IsNotEmpty()
  createdBy: string; // User ID or 'system'

  @IsObject()
  data: any; // Raw workflow JSON from HubSpot
}
