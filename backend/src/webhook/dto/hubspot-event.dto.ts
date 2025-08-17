import { Type } from 'class-transformer';
import {
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsString,
  ValidateNested,
} from 'class-validator';

export class HubspotEventDto {
  @IsNumber()
  @IsNotEmpty()
  objectId: number;

  @IsString()
  @IsNotEmpty()
  subscriptionType: string;

  @IsNumber()
  @IsNotEmpty()
  portalId: number;

  @IsNumber()
  @IsNotEmpty()
  appId: number;

  @IsNumber()
  @IsNotEmpty()
  occurredAt: number;
}

export class HubspotWebhookDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => HubspotEventDto)
  events: HubspotEventDto[];
}
