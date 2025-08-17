# Multi-Currency Implementation Guide

## Overview

WorkflowGuard now supports automatic currency detection and multi-currency billing for international customers. The system supports USD, GBP, EUR, INR, and CAD with automatic currency detection based on card BIN numbers and IP geolocation.

## Features Implemented

### 1. Currency Detection Service (`/src/currency/currency.service.ts`)
- **Automatic Currency Detection**: Detects currency from card BIN, IP address, or user preference
- **Multi-Currency Support**: USD, GBP, EUR, INR, CAD
- **Real-time Conversion**: Converts prices between currencies
- **Confidence Scoring**: Provides confidence levels for currency detection

### 2. Enhanced Razorpay Plans Service (`/src/razorpay/razorpay-plans.service.ts`)
- **Multi-Currency Plans**: Each plan now supports all 5 currencies
- **Dynamic Pricing**: Calculates prices in all currencies from USD base price
- **Plan ID Management**: Handles currency-specific Razorpay plan IDs
- **Currency Detection Integration**: Automatically selects appropriate currency for users

### 3. Updated Subscription Service (`/src/subscription/subscription.service.ts`)
- **Currency-Aware Subscriptions**: Stores currency with each subscription
- **Multi-Currency Pricing**: Returns pricing in user's preferred currency
- **Automatic Currency Assignment**: Creates subscriptions with detected currency

### 4. Multi-Currency Billing Controller (`/src/billing/multi-currency-billing.controller.ts`)
- **Currency Detection API**: `POST /billing/multi-currency/detect-currency`
- **Multi-Currency Plans**: `GET /billing/multi-currency/plans?currency=USD`
- **Auto-Currency Subscriptions**: `POST /billing/multi-currency/create-subscription`
- **Plan Pricing**: `GET /billing/multi-currency/plan-pricing/:planId?currency=USD`

## Database Changes

### Updated Subscription Model
```prisma
model Subscription {
  id              String    @id @default(uuid())
  userId          String    @unique
  planId          String
  currency        String    @default("USD")  // NEW FIELD
  razorpay_subscription_id String?   @unique
  status          String
  trialEndDate    DateTime?
  nextBillingDate DateTime?
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  user            User      @relation(fields: [userId], references: [id])
}
```

## Environment Variables

### Required Plan IDs for Each Currency
```bash
# USD Plans
RAZORPAY_PLAN_ID_STARTER_USD="plan_starter_usd_monthly"
RAZORPAY_PLAN_ID_PROFESSIONAL_USD="plan_professional_usd_monthly"
RAZORPAY_PLAN_ID_ENTERPRISE_USD="plan_enterprise_usd_monthly"

# GBP Plans
RAZORPAY_PLAN_ID_STARTER_GBP="plan_starter_gbp_monthly"
RAZORPAY_PLAN_ID_PROFESSIONAL_GBP="plan_professional_gbp_monthly"
RAZORPAY_PLAN_ID_ENTERPRISE_GBP="plan_enterprise_gbp_monthly"

# EUR Plans
RAZORPAY_PLAN_ID_STARTER_EUR="plan_starter_eur_monthly"
RAZORPAY_PLAN_ID_PROFESSIONAL_EUR="plan_professional_eur_monthly"
RAZORPAY_PLAN_ID_ENTERPRISE_EUR="plan_enterprise_eur_monthly"

# CAD Plans
RAZORPAY_PLAN_ID_STARTER_CAD="plan_starter_cad_monthly"
RAZORPAY_PLAN_ID_PROFESSIONAL_CAD="plan_professional_cad_monthly"
RAZORPAY_PLAN_ID_ENTERPRISE_CAD="plan_enterprise_cad_monthly"

# INR Plans (Already configured)
RAZORPAY_PLAN_ID_STARTER_INR="plan_R6RI02CsUCUlDz"
RAZORPAY_PLAN_ID_PROFESSIONAL_INR="plan_R6RKEg5mqJK6Ky"
RAZORPAY_PLAN_ID_ENTERPRISE_INR="plan_R6RKnjqXu0BZsH"
```

## API Endpoints

### 1. Get Supported Currencies
```http
GET /billing/multi-currency/currencies
```

**Response:**
```json
{
  "success": true,
  "currencies": [
    {
      "code": "USD",
      "symbol": "$",
      "name": "US Dollar",
      "countryRegions": ["US", "PR", "VI"],
      "exchangeRate": 1.0
    }
  ]
}
```

### 2. Detect Currency
```http
POST /billing/multi-currency/detect-currency
Content-Type: application/json

{
  "cardNumber": "4111111111111111",
  "countryCode": "US",
  "userPreference": "USD"
}
```

**Response:**
```json
{
  "success": true,
  "detectedCurrency": "USD",
  "confidence": 0.9,
  "source": "card",
  "currencyInfo": {
    "code": "USD",
    "symbol": "$",
    "name": "US Dollar"
  }
}
```

### 3. Get Plans with Currency
```http
GET /billing/multi-currency/plans?currency=GBP
```

**Response:**
```json
{
  "success": true,
  "plans": [
    {
      "id": "starter",
      "name": "Starter Plan",
      "basePrice": 19,
      "currency": "GBP",
      "prices": {
        "USD": { "amount": 19, "formatted": "$19.00" },
        "GBP": { "amount": 15.01, "formatted": "£15.01" },
        "EUR": { "amount": 17.48, "formatted": "€17.48" }
      }
    }
  ]
}
```

### 4. Create Subscription with Auto-Currency
```http
POST /billing/multi-currency/create-subscription
Content-Type: application/json

{
  "planId": "professional",
  "cardNumber": "4111111111111111",
  "countryCode": "GB"
}
```

**Response:**
```json
{
  "success": true,
  "subscription": {
    "id": "sub_123",
    "planId": "professional",
    "currency": "GBP",
    "confidence": 0.8
  },
  "razorpaySubscription": {
    "id": "sub_razorpay_123",
    "short_url": "https://rzp.io/i/abc123",
    "status": "created"
  }
}
```

## Currency Detection Logic

### 1. Priority Order
1. **User Preference** (confidence: 1.0)
2. **Card BIN Detection** (confidence: 0.7-0.9)
3. **IP/Country Detection** (confidence: 0.8)
4. **Default to USD** (confidence: 0.1)

### 2. Card BIN Detection
- Uses first 4-6 digits of card number
- Maps to specific currencies based on issuing bank
- Higher confidence for longer BIN matches

### 3. IP Geolocation
- Maps country codes to currencies
- Handles multi-currency countries (defaults to primary currency)

## Setup Instructions

### 1. Database Migration
```bash
# Add currency field to subscriptions
npx prisma migrate dev --name add-currency-to-subscription
npx prisma generate
```

### 2. Create Razorpay Plans
1. Log into Razorpay Dashboard
2. Create subscription plans for each currency:
   - Starter: $19/month, £15/month, €17/month, ₹1599/month, C$26/month
   - Professional: $49/month, £39/month, €45/month, ₹4099/month, C$67/month
   - Enterprise: $99/month, £78/month, €91/month, ₹8299/month, C$135/month
3. Update environment variables with actual plan IDs

### 3. Test Currency Detection
```bash
# Run setup script
npm run setup:multi-currency

# Test API endpoints
curl -X POST http://localhost:4000/billing/multi-currency/detect-currency \
  -H "Content-Type: application/json" \
  -d '{"cardNumber":"4111111111111111","countryCode":"US"}'
```

## Integration with Frontend

### 1. Currency Selection
```typescript
// Get user's detected currency
const response = await fetch('/api/billing/multi-currency/detect-currency', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    cardNumber: cardNumber.substring(0, 6), // Only send BIN
    countryCode: userCountry
  })
});

const { detectedCurrency, confidence } = await response.json();
```

### 2. Display Pricing
```typescript
// Get plans in user's currency
const plans = await fetch(`/api/billing/multi-currency/plans?currency=${detectedCurrency}`);
const { plans: currencyPlans } = await plans.json();

// Display with proper currency formatting
currencyPlans.forEach(plan => {
  console.log(`${plan.name}: ${plan.prices[detectedCurrency].formatted}`);
});
```

## Benefits

1. **Automatic Currency Handling**: No manual currency selection needed
2. **Improved Conversion Rates**: Users see prices in familiar currency
3. **Reduced Payment Friction**: Local currency reduces confusion
4. **Global Scalability**: Easy to add new currencies
5. **Intelligent Detection**: High-confidence currency detection

## Future Enhancements

1. **Dynamic Exchange Rates**: Integrate with live exchange rate APIs
2. **Regional Pricing**: Different base prices for different regions
3. **Currency Preferences**: Allow users to override detected currency
4. **Analytics**: Track conversion rates by currency
5. **Localization**: Full localization including date formats, etc.

## Troubleshooting

### Common Issues

1. **Plan ID Not Found**: Ensure all currency-specific plan IDs are configured in environment variables
2. **Currency Detection Failed**: Check card BIN database and IP geolocation service
3. **Prisma Errors**: Run `npx prisma generate` after schema changes
4. **Module Import Errors**: Ensure all modules are properly imported in app.module.ts

### Debug Endpoints

- `GET /billing/multi-currency/razorpay-plan-ids` - Check configured plan IDs
- `POST /billing/multi-currency/convert-price` - Test currency conversion
- `GET /billing/multi-currency/currencies` - Verify supported currencies
