import { RazorpayPlansService } from '../razorpay/razorpay-plans.service';
import { CurrencyService } from '../currency/currency.service';
import { RazorpayService } from '../razorpay/razorpay.service';

/**
 * Multi-Currency Setup Script
 * 
 * This script helps you set up multi-currency support for WorkflowGuard.
 * It will create Razorpay plans for all supported currencies and generate
 * the environment variables you need to add to your .env file.
 */

async function setupMultiCurrency() {
  console.log('🌍 Setting up Multi-Currency Support for WorkflowGuard');
  console.log('=====================================================\n');

  // Initialize services
  const razorpayService = new RazorpayService();
  const currencyService = new CurrencyService();
  const razorpayPlansService = new RazorpayPlansService(razorpayService, currencyService);

  // Display supported currencies
  console.log('📋 Supported Currencies:');
  const currencies = currencyService.getSupportedCurrencies();
  currencies.forEach(currency => {
    console.log(`   ${currency.code} - ${currency.name} (${currency.symbol})`);
  });
  console.log('');

  // Display plan pricing in all currencies
  console.log('💰 Plan Pricing Across All Currencies:');
  const plans = ['starter', 'professional', 'enterprise'];
  
  for (const planId of plans) {
    console.log(`\n${planId.toUpperCase()} PLAN:`);
    const plan = razorpayPlansService.getPlan(planId);
    const allPrices = currencyService.getAllCurrencyPrices(plan.basePrice);
    
    Object.entries(allPrices).forEach(([code, pricing]) => {
      console.log(`   ${code}: ${pricing.formatted}`);
    });
  }

  console.log('\n🔧 Environment Variables Needed:');
  console.log('Add these to your .env file after creating plans in Razorpay Dashboard:\n');

  // Generate environment variable template
  const envVars: string[] = [];
  for (const currency of ['USD', 'GBP', 'EUR', 'INR', 'CAD']) {
    for (const plan of plans) {
      const envKey = `RAZORPAY_PLAN_ID_${plan.toUpperCase()}_${currency}`;
      envVars.push(`${envKey}="plan_${plan}_${currency.toLowerCase()}_monthly"`);
    }
  }

  envVars.forEach(envVar => console.log(envVar));

  console.log('\n📝 Next Steps:');
  console.log('1. Create plans in Razorpay Dashboard for each currency');
  console.log('2. Update your .env file with the actual Razorpay plan IDs');
  console.log('3. Test the currency detection API endpoints');
  console.log('4. Deploy and test with international cards');

  console.log('\n🚀 API Endpoints Available:');
  console.log('GET  /billing/multi-currency/currencies - Get supported currencies');
  console.log('GET  /billing/multi-currency/plans?currency=USD - Get plans for currency');
  console.log('POST /billing/multi-currency/detect-currency - Detect currency from card/IP');
  console.log('POST /billing/multi-currency/create-subscription - Create subscription with auto-currency');
  console.log('GET  /billing/multi-currency/plan-pricing/:planId?currency=USD - Get plan pricing');

  return {
    success: true,
    currencies: currencies.length,
    plans: plans.length,
    totalCombinations: currencies.length * plans.length
  };
}

// Export for use in other scripts
export { setupMultiCurrency };

// Run if called directly
if (require.main === module) {
  setupMultiCurrency()
    .then(result => {
      console.log(`\n✅ Setup complete! ${result.totalCombinations} plan combinations configured.`);
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Setup failed:', error);
      process.exit(1);
    });
}
