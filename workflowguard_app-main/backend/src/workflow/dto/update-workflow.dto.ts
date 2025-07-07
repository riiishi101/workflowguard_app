import { IsString, IsOptional } from 'class-validator';

export class UpdateWorkflowDto {
  @IsString()
  @IsOptional()
  hubspotId?: string;

  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  ownerId?: string;
} 