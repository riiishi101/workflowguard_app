import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Query,
  UseGuards,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { OverageService } from './overage.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { HubSpotBillingService } from '../services/hubspot-billing.service';
import { ApiParam } from '@nestjs/swagger';

@Controller('overages')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class OverageController {
  constructor(
    private readonly overageService: OverageService,
    private readonly hubspotBillingService: HubSpotBillingService,
  ) {}

  @Get()
  async findAll(
    @Query('userId') userId?: string,
    @Query('billed') billed?: string,
    @Query('periodStart') periodStart?: string,
    @Query('periodEnd') periodEnd?: string,
  ) {
    const filters: any = {};
    if (userId) filters.userId = userId;
    if (billed !== undefined) filters.billed = billed === 'true';
    if (periodStart && periodEnd) {
      filters.periodStart = { gte: new Date(periodStart) };
      filters.periodEnd = { lte: new Date(periodEnd) };
    }

    return this.overageService.findAll(filters);
  }

  @Get(':id')
  @ApiParam({ name: 'id', type: String, description: 'Overage ID' })
  async findOne(@Param('id') id: string) {
    const overage = await this.overageService.findOne(id);
    if (!overage) {
      throw new HttpException('Overage not found', HttpStatus.NOT_FOUND);
    }
    return overage;
  }

  @Patch(':id/bill')
  @ApiParam({ name: 'id', type: String, description: 'Overage ID' })
  async markAsBilled(@Param('id') id: string) {
    return this.overageService.markAsBilled(id);
  }

  @Post('bulk-bill')
  async bulkBillOverages(@Body() body: { overageIds: string[] }) {
    try {
      const results = await this.hubspotBillingService.reportOveragesToHubSpot(
        body.overageIds,
      );
      return {
        message: 'Bulk billing completed',
        processed: results.length,
        successful: results.filter((r) => r.success).length,
        failed: results.filter((r) => !r.success).length,
        results,
      };
    } catch (error) {
      throw new HttpException(
        `Bulk billing failed: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('billing-status')
  async getBillingStatus() {
    try {
      const unbilledOverages = await this.overageService.getUnbilledOverages();
      const totalUnbilled = unbilledOverages.reduce(
        (sum, o) => sum + o.amount,
        0,
      );

      return {
        status: 'operational',
        unbilledCount: unbilledOverages.length,
        totalUnbilledAmount: totalUnbilled,
        lastChecked: new Date().toISOString(),
        message: 'Billing system is operational',
      };
    } catch (error) {
      return {
        status: 'error',
        error: error.message,
        lastChecked: new Date().toISOString(),
        message: 'Billing system encountered an error',
      };
    }
  }

  @Get('report/summary')
  async getOverageSummary(
    @Query('periodStart') periodStart?: string,
    @Query('periodEnd') periodEnd?: string,
  ) {
    const startDate = periodStart ? new Date(periodStart) : undefined;
    const endDate = periodEnd ? new Date(periodEnd) : undefined;
    return this.overageService.getOverageSummary(startDate, endDate);
  }

  @Get('report/unbilled')
  async getUnbilledOverages() {
    return this.overageService.getUnbilledOverages();
  }
}
