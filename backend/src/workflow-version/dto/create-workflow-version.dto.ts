import { IsString, IsNumber, IsNotEmpty, IsObject } from 'class-validator';

export class CreateWorkflowVersionDto {
  @IsString()
  @IsNotEmpty()
  workflowId: string;

  @IsNumber()
  version: number;

  @IsString()
  @IsNotEmpty()
  snapshotType: string; // 'manual', 'on-publish', 'daily-backup'

  @IsString()
  @IsNotEmpty()
  createdBy: string; // User ID or 'system'

  @IsObject()
  data: any; // Raw workflow JSON from HubSpot
}
