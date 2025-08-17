import { IsString, IsNotEmpty } from 'class-validator';

export class DiagnoseIssueDto {
  @IsString()
  @IsNotEmpty()
  description: string;
}
