import { IsString, IsObject, IsOptional } from 'class-validator';

export class UpdateWorkflowVersionDto {
  @IsString()
  @IsOptional()
  snapshotType?: string;

  @IsObject()
  @IsOptional()
  data?: any;
}
