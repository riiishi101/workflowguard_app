import { Controller, Post, Body, UseGuards, Req, HttpException, HttpStatus } from '@nestjs/common';
import { SupportService } from './support.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('support')
export class SupportController {
  constructor(private readonly supportService: SupportService) {}

  @Post('diagnose')
  @UseGuards(JwtAuthGuard)
  async diagnoseIssue(@Body() body: { description: string }, @Req() req: any) {
    console.log('🔍 SupportController - diagnoseIssue called');
    
    let userId = req.user?.sub || req.user?.id || req.user?.userId;
    if (!userId) {
      userId = req.headers['x-user-id'];
    }
    
    if (!userId) {
      throw new HttpException('User ID not found', HttpStatus.UNAUTHORIZED);
    }

    if (!body.description) {
      throw new HttpException('Issue description is required', HttpStatus.BAD_REQUEST);
    }

    try {
      const diagnosis = await this.supportService.diagnoseIssue(body.description, userId);
      return diagnosis;
    } catch (error) {
      console.error('🔍 SupportController - Error in diagnoseIssue:', error);
      throw new HttpException(
        `Failed to diagnose issue: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('fix-rollback')
  @UseGuards(JwtAuthGuard)
  async fixRollbackIssue(@Req() req: any) {
    console.log('🔍 SupportController - fixRollbackIssue called');
    
    let userId = req.user?.sub || req.user?.id || req.user?.userId;
    if (!userId) {
      userId = req.headers['x-user-id'];
    }
    
    if (!userId) {
      throw new HttpException('User ID not found', HttpStatus.UNAUTHORIZED);
    }

    try {
      const result = await this.supportService.fixRollbackIssue(userId);
      return result;
    } catch (error) {
      console.error('🔍 SupportController - Error in fixRollbackIssue:', error);
      throw new HttpException(
        `Failed to fix rollback issue: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('fix-sync')
  @UseGuards(JwtAuthGuard)
  async fixSyncIssue(@Req() req: any) {
    console.log('🔍 SupportController - fixSyncIssue called');
    
    let userId = req.user?.sub || req.user?.id || req.user?.userId;
    if (!userId) {
      userId = req.headers['x-user-id'];
    }
    
    if (!userId) {
      throw new HttpException('User ID not found', HttpStatus.UNAUTHORIZED);
    }

    try {
      const result = await this.supportService.fixSyncIssue(userId);
      return result;
    } catch (error) {
      console.error('🔍 SupportController - Error in fixSyncIssue:', error);
      throw new HttpException(
        `Failed to fix sync issue: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('fix-auth')
  @UseGuards(JwtAuthGuard)
  async fixAuthIssue(@Req() req: any) {
    console.log('🔍 SupportController - fixAuthIssue called');
    
    let userId = req.user?.sub || req.user?.id || req.user?.userId;
    if (!userId) {
      userId = req.headers['x-user-id'];
    }
    
    if (!userId) {
      throw new HttpException('User ID not found', HttpStatus.UNAUTHORIZED);
    }

    try {
      const result = await this.supportService.fixAuthIssue(userId);
      return result;
    } catch (error) {
      console.error('🔍 SupportController - Error in fixAuthIssue:', error);
      throw new HttpException(
        `Failed to fix auth issue: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('fix-data')
  @UseGuards(JwtAuthGuard)
  async fixDataIssue(@Req() req: any) {
    console.log('🔍 SupportController - fixDataIssue called');
    
    let userId = req.user?.sub || req.user?.id || req.user?.userId;
    if (!userId) {
      userId = req.headers['x-user-id'];
    }
    
    if (!userId) {
      throw new HttpException('User ID not found', HttpStatus.UNAUTHORIZED);
    }

    try {
      const result = await this.supportService.fixDataIssue(userId);
      return result;
    } catch (error) {
      console.error('🔍 SupportController - Error in fixDataIssue:', error);
      throw new HttpException(
        `Failed to fix data issue: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('optimize-performance')
  @UseGuards(JwtAuthGuard)
  async optimizePerformance(@Req() req: any) {
    console.log('🔍 SupportController - optimizePerformance called');
    
    let userId = req.user?.sub || req.user?.id || req.user?.userId;
    if (!userId) {
      userId = req.headers['x-user-id'];
    }
    
    if (!userId) {
      throw new HttpException('User ID not found', HttpStatus.UNAUTHORIZED);
    }

    try {
      const result = await this.supportService.optimizePerformance(userId);
      return result;
    } catch (error) {
      console.error('🔍 SupportController - Error in optimizePerformance:', error);
      throw new HttpException(
        `Failed to optimize performance: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
} 