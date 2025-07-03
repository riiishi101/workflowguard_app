import { IsString } from 'class-validator';
 
export class CreateApiKeyDto {
  @IsString()
  description: string;
} 