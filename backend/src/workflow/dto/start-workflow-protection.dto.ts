import { IsArray, IsString, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class WorkflowDto {
  @IsString()
  id: string;

  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  hubspotId?: string;
}

export class StartWorkflowProtectionDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WorkflowDto)
  workflows: WorkflowDto[];

  @IsOptional()
  @IsString()
  userId?: string;
}
