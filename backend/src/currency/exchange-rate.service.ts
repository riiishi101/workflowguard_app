import { Injectable, Logger, Inject } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { Cache } from 'cache-manager';
import { CACHE_MANAGER } from '@nestjs/cache-manager';

const CACHE_KEY = 'exchange_rates_usd';
const CACHE_TTL_SECONDS = 3600; // 1 hour

@Injectable()
export class ExchangeRateService {
  private readonly logger = new Logger(ExchangeRateService.name);
  private readonly apiUrl = `https://api.exchangerate-api.com/v4/latest/USD`;

  constructor(
    private readonly httpService: HttpService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {}

  async getRates(): Promise<Record<string, number>> {
    const cachedRates = await this.cacheManager.get<Record<string, number>>(
      CACHE_KEY,
    );
    if (cachedRates) {
      this.logger.log('Returning exchange rates from cache');
      return cachedRates;
    }

    this.logger.log('Fetching fresh exchange rates from API');
    try {
      const response = await this.httpService.get(this.apiUrl).toPromise();
      if (!response || !response.data || !response.data.rates) {
        throw new Error('Invalid API response from ExchangeRate-API');
      }
      const rates = response.data.rates;

      if (!rates) {
        throw new Error('Invalid API response from ExchangeRate-API');
      }

      await this.cacheManager.set(CACHE_KEY, rates, CACHE_TTL_SECONDS);
      return rates;
    } catch (error) {
      this.logger.error('Failed to fetch exchange rates', error.stack);
      // Fallback or re-throw as per application's error handling strategy
      throw new Error('Could not fetch exchange rates.');
    }
  }
}
