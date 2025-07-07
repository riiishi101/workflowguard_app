import { IsString, IsNotEmpty } from 'class-validator';

export class CreateWorkflowDto {
  @IsString()
  @IsNotEmpty()
  hubspotId: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  ownerId: string;
} 