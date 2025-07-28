# WorkflowGuard Manual QA & Production Checklist

## 1. Authentication
- [ ] Sign up as a new user
- [ ] Log in with valid credentials
- [ ] Log out
- [ ] Password reset flow (request, email, reset)
- [ ] Invalid login attempt shows error

## 2. Dashboard
- [ ] View list of workflows
- [ ] Search workflows
- [ ] Filter workflows
- [ ] View workflow details
- [ ] Rollback/restore workflow version
- [ ] Empty state (no workflows)
- [ ] Error state (API down or error)

## 3. Billing & Subscription
- [ ] View current plan
- [ ] Upgrade/downgrade plan
- [ ] HubSpot billing integration works
- [ ] Overage warning/handling

## 4. Webhooks
- [ ] Add a webhook
- [ ] Edit a webhook
- [ ] Delete a webhook
- [ ] Test webhook delivery

## 5. Notifications
- [ ] View notification settings
- [ ] Update notification preferences
- [ ] Receive notification (if applicable)

## 6. User Management
- [ ] Add a new user
- [ ] Remove a user
- [ ] Change user role/permissions
- [ ] User permissions enforced in UI

## 7. Realtime & Analytics
- [ ] Real-time updates appear (if applicable)
- [ ] Analytics data loads and displays

## 8. Error Handling & States
- [ ] All API errors show user-friendly messages
- [ ] Loading states are shown where appropriate
- [ ] No blank or broken screens

## 9. Mobile & Responsiveness
- [ ] App works on mobile devices
- [ ] Layout adapts to different screen sizes

## 10. Security & Environment
- [ ] No sensitive data exposed in frontend
- [ ] All environment variables set in Render/Vercel
- [ ] HTTPS enforced in production

## 11. Logs & Monitoring
- [ ] No errors in Render logs
- [ ] No errors in Vercel logs
- [ ] Health and readiness endpoints return OK

## 12. HubSpot App Marketplace Readiness
- [ ] App works as described in listing
- [ ] No broken flows or critical bugs
- [ ] User onboarding is clear
- [ ] Privacy policy and terms are accessible

---

**Sign off each item before submitting to the HubSpot App Marketplace!** 