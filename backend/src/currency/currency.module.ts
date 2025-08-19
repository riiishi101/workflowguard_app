import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { CacheModule } from '@nestjs/cache-manager';
import { CurrencyService } from './currency.service';
import { ExchangeRateService } from './exchange-rate.service';

@Module({
  imports: [
    HttpModule,
    CacheModule.register(), // In-memory cache
  ],
  providers: [CurrencyService, ExchangeRateService],
  exports: [CurrencyService],
})
export class CurrencyModule {}
