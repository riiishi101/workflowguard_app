# Razorpay Live Keys Configuration - WorkflowGuard

## Live API Credentials
Your Razorpay account is now configured with live keys for international payments:

- **Live Key ID:** `rzp_live_R6PjXR1FYupO0Y`
- **Live Key Secret:** `O5McpwbAgoiSNMJDQetruaTK`

## Next Steps for Production Deployment

### 1. Update Environment Variables on VPS

When deploying to your Hostinger VPS, create/update these files:

#### Backend Environment (`/var/www/workflowguard_app/backend/.env`)
```env
# Razorpay Configuration (LIVE KEYS)
RAZORPAY_KEY_ID="rzp_live_R6PjXR1FYupO0Y"
RAZORPAY_KEY_SECRET="O5McpwbAgoiSNMJDQetruaTK"
RAZORPAY_WEBHOOK_SECRET="your-webhook-secret-from-razorpay-dashboard"
```

#### Frontend Environment (`/var/www/workflowguard_app/frontend/.env.production`)
```env
# Razorpay Configuration (LIVE KEYS)
VITE_RAZORPAY_KEY_ID=rzp_live_R6PjXR1FYupO0Y
```

### 2. Configure Razorpay Webhooks

Set up webhook endpoints in your Razorpay Dashboard:

1. Go to Razorpay Dashboard → Settings → Webhooks
2. Add webhook URL: `https://api.workflowguard.pro/api/razorpay/webhook`
3. Select events:
   - `payment.authorized`
   - `payment.failed`
   - `payment.captured`
   - `subscription.activated`
   - `subscription.charged`
   - `subscription.cancelled`
4. Copy the webhook secret and update `RAZORPAY_WEBHOOK_SECRET`

### 3. International Payment Settings

Ensure these are enabled in your Razorpay Dashboard:
- ✅ International payments activated
- ✅ Multi-currency support enabled
- ✅ Credit/Debit cards enabled
- ✅ UPI enabled (for Indian customers)
- ✅ Wallets enabled

### 4. Supported Currencies

Your app now supports international payments in:
- USD (US Dollar)
- EUR (Euro)
- GBP (British Pound)
- INR (Indian Rupee)
- AUD (Australian Dollar)
- CAD (Canadian Dollar)

### 5. Test Live Integration

After deployment, test with small amounts:
1. Create a test subscription
2. Use real card details (small amount)
3. Verify webhook notifications
4. Check payment status in Razorpay Dashboard

### 6. Security Considerations

- ✅ Live keys are configured in production environment only
- ✅ Webhook signature verification enabled
- ✅ HTTPS enforced for all payment endpoints
- ✅ Sensitive data encrypted in database

## Deployment Commands

After updating environment variables on VPS:

```bash
# Restart the application
cd /var/www/workflowguard_app
pm2 restart workflowguard-backend

# Verify environment variables are loaded
pm2 logs workflowguard-backend
```

## Monitoring

Monitor payments in:
- Razorpay Dashboard: Live transactions
- WorkflowGuard Admin: Subscription status
- Server logs: Payment webhook events

Your WorkflowGuard app is now ready for live international payments! 🚀
