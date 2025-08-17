import { Injectable } from '@nestjs/common';

export interface CurrencyConfig {
  code: string;
  symbol: string;
  name: string;
  countryRegions: string[];
  exchangeRate: number; // Base currency is USD
}

export interface CurrencyDetectionResult {
  currency: string;
  confidence: number;
  source: 'card' | 'ip' | 'default';
}

@Injectable()
export class CurrencyService {
  private readonly currencies: Record<string, CurrencyConfig> = {
    USD: {
      code: 'USD',
      symbol: '$',
      name: 'US Dollar',
      countryRegions: ['US', 'PR', 'VI', 'GU', 'AS', 'MP'],
      exchangeRate: 1.0
    },
    GBP: {
      code: 'GBP',
      symbol: '£',
      name: 'British Pound',
      countryRegions: ['GB', 'UK', 'IM', 'JE', 'GG'],
      exchangeRate: 0.79
    },
    EUR: {
      code: 'EUR',
      symbol: '€',
      name: 'Euro',
      countryRegions: ['DE', 'FR', 'IT', 'ES', 'NL', 'BE', 'AT', 'PT', 'IE', 'FI', 'GR', 'LU', 'SI', 'CY', 'MT', 'SK', 'EE', 'LV', 'LT'],
      exchangeRate: 0.92
    },
    INR: {
      code: 'INR',
      symbol: '₹',
      name: 'Indian Rupee',
      countryRegions: ['IN'],
      exchangeRate: 83.12
    },
    CAD: {
      code: 'CAD',
      symbol: 'C$',
      name: 'Canadian Dollar',
      countryRegions: ['CA'],
      exchangeRate: 1.36
    }
  };

  private readonly cardBinToCurrency: Record<string, string> = {
    // Major US card BINs
    '4': 'USD', // Visa (default to USD for international)
    '5': 'USD', // Mastercard (default to USD for international)
    '3': 'USD', // American Express (default to USD)
    
    // UK specific BINs (examples - you'd need actual BIN database)
    '4462': 'GBP', // UK Visa
    '5555': 'GBP', // UK Mastercard
    
    // European BINs (examples)
    '4000': 'EUR', // European Visa
    '5200': 'EUR', // European Mastercard
    
    // Indian BINs
    '6074': 'INR', // RuPay
    '4847': 'INR', // Indian Visa
    '5267': 'INR', // Indian Mastercard
    
    // Canadian BINs
    '4506': 'CAD', // Canadian Visa
    '5191': 'CAD'  // Canadian Mastercard
  };

  getSupportedCurrencies(): CurrencyConfig[] {
    return Object.values(this.currencies);
  }

  getCurrency(code: string): CurrencyConfig | null {
    return this.currencies[code.toUpperCase()] || null;
  }

  detectCurrencyFromCard(cardNumber: string): CurrencyDetectionResult {
    // Remove spaces and non-digits
    const cleanCard = cardNumber.replace(/\D/g, '');
    
    // Check BIN (Bank Identification Number) - first 6 digits
    const bin = cleanCard.substring(0, 6);
    
    // Try exact BIN match first
    for (const [binPrefix, currency] of Object.entries(this.cardBinToCurrency)) {
      if (bin.startsWith(binPrefix)) {
        return {
          currency,
          confidence: binPrefix.length >= 4 ? 0.9 : 0.7,
          source: 'card'
        };
      }
    }

    // Default to USD for international cards
    return {
      currency: 'USD',
      confidence: 0.5,
      source: 'card'
    };
  }

  detectCurrencyFromIP(ipAddress: string, countryCode?: string): CurrencyDetectionResult {
    if (countryCode) {
      // Find currency by country code
      for (const [currencyCode, config] of Object.entries(this.currencies)) {
        if (config.countryRegions.includes(countryCode.toUpperCase())) {
          return {
            currency: currencyCode,
            confidence: 0.8,
            source: 'ip'
          };
        }
      }
    }

    // Default to USD if no match
    return {
      currency: 'USD',
      confidence: 0.3,
      source: 'ip'
    };
  }

  detectCurrencyAuto(options: {
    cardNumber?: string;
    ipAddress?: string;
    countryCode?: string;
    userPreference?: string;
  }): CurrencyDetectionResult {
    const results: CurrencyDetectionResult[] = [];

    // 1. User preference (highest priority)
    if (options.userPreference && this.currencies[options.userPreference.toUpperCase()]) {
      return {
        currency: options.userPreference.toUpperCase(),
        confidence: 1.0,
        source: 'card'
      };
    }

    // 2. Card-based detection
    if (options.cardNumber) {
      results.push(this.detectCurrencyFromCard(options.cardNumber));
    }

    // 3. IP/Country-based detection
    if (options.ipAddress || options.countryCode) {
      results.push(this.detectCurrencyFromIP(options.ipAddress || '', options.countryCode));
    }

    // Return the result with highest confidence
    if (results.length > 0) {
      return results.reduce((best, current) => 
        current.confidence > best.confidence ? current : best
      );
    }

    // Final fallback
    return {
      currency: 'USD',
      confidence: 0.1,
      source: 'default'
    };
  }

  convertPrice(amount: number, fromCurrency: string, toCurrency: string): number {
    const from = this.getCurrency(fromCurrency);
    const to = this.getCurrency(toCurrency);

    if (!from || !to) {
      throw new Error(`Unsupported currency conversion: ${fromCurrency} to ${toCurrency}`);
    }

    // Convert to USD first, then to target currency
    const usdAmount = amount / from.exchangeRate;
    const convertedAmount = usdAmount * to.exchangeRate;

    return Math.round(convertedAmount * 100) / 100; // Round to 2 decimal places
  }

  formatPrice(amount: number, currency: string): string {
    const config = this.getCurrency(currency);
    if (!config) {
      return `${amount} ${currency}`;
    }

    return `${config.symbol}${amount.toFixed(2)}`;
  }

  // Get pricing for all currencies based on USD base price
  getAllCurrencyPrices(usdPrice: number): Record<string, { amount: number; formatted: string }> {
    const prices: Record<string, { amount: number; formatted: string }> = {};

    for (const [code, config] of Object.entries(this.currencies)) {
      const amount = this.convertPrice(usdPrice, 'USD', code);
      prices[code] = {
        amount,
        formatted: this.formatPrice(amount, code)
      };
    }

    return prices;
  }
}
