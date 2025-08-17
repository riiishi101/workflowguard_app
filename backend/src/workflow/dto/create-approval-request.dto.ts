import { IsNotEmpty, IsObject } from 'class-validator';

export class CreateApprovalRequestDto {
  @IsObject()
  @IsNotEmpty()
  requestedChanges: Record<string, any>;
}
