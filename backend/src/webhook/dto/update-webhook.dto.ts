import { IsString, IsUrl, IsArray, IsOptional } from 'class-validator';

export class UpdateWebhookDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsUrl()
  @IsOptional()
  endpointUrl?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  events?: string[];
}
