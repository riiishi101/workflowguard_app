import { IsNotEmpty, IsString, IsObject } from 'class-validator';

export class CreateChangeNotificationDto {
  @IsObject()
  @IsNotEmpty()
  changes: Record<string, any>;
}
