import { IsString, IsUrl, IsArray, IsOptional } from 'class-validator';

export class CreateWebhookDto {
  @IsString()
  name: string;

  @IsUrl()
  endpointUrl: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  events?: string[];
}
