import {
  Controller,
  Post,
  Body,
  UseGuards,
  Req,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { SupportService } from './support.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RequestWithUser } from '../types/auth.types';
import { DiagnoseIssueDto } from './dto/diagnose-issue.dto';

@Controller('support')
export class SupportController {
  constructor(private readonly supportService: SupportService) {}

  private getUserId(req: RequestWithUser): string {
    const userId = req.user?.sub || req.user?.id || req.user?.userId;
    if (!userId) {
      throw new HttpException('User ID not found in token', HttpStatus.UNAUTHORIZED);
    }
    return userId;
  }

  @Post('diagnose')
  @UseGuards(JwtAuthGuard)
  async diagnoseIssue(
    @Body() diagnoseIssueDto: DiagnoseIssueDto,
    @Req() req: RequestWithUser,
  ) {
    const userId = this.getUserId(req);
    try {
      return await this.supportService.diagnoseIssue(
        diagnoseIssueDto.description,
        userId,
      );
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      throw new HttpException(
        `Failed to diagnose issue: ${message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('fix-rollback')
  @UseGuards(JwtAuthGuard)
  async fixRollbackIssue(@Req() req: RequestWithUser) {
    const userId = this.getUserId(req);
    try {
      return await this.supportService.fixRollbackIssue(userId);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      throw new HttpException(
        `Failed to fix rollback issue: ${message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('fix-sync')
  @UseGuards(JwtAuthGuard)
  async fixSyncIssue(@Req() req: RequestWithUser) {
    const userId = this.getUserId(req);
    try {
      return await this.supportService.fixSyncIssue(userId);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      throw new HttpException(
        `Failed to fix sync issue: ${message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('fix-auth')
  @UseGuards(JwtAuthGuard)
  async fixAuthIssue(@Req() req: RequestWithUser) {
    const userId = this.getUserId(req);
    try {
      return await this.supportService.fixAuthIssue(userId);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      throw new HttpException(
        `Failed to fix auth issue: ${message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('fix-data')
  @UseGuards(JwtAuthGuard)
  async fixDataIssue(@Req() req: RequestWithUser) {
    const userId = this.getUserId(req);
    try {
      return await this.supportService.fixDataIssue(userId);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      throw new HttpException(
        `Failed to fix data issue: ${message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('optimize-performance')
  @UseGuards(JwtAuthGuard)
  async optimizePerformance(@Req() req: RequestWithUser) {
    const userId = this.getUserId(req);
    try {
      return await this.supportService.optimizePerformance(userId);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      throw new HttpException(
        `Failed to optimize performance: ${message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
