import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle, Star, Zap, Shield, Users, Crown } from 'lucide-react';
import HubSpotBillingService, { BillingPlan } from '@/services/HubSpotBillingService';
import { useAuth } from '@/contexts/AuthContext';

export default function Pricing() {
  const [plans, setPlans] = useState<BillingPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingPlan, setProcessingPlan] = useState<string | null>(null);
  const [currentPlan, setCurrentPlan] = useState<BillingPlan | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    try {
      setLoading(true);
      setError(null);
      const availablePlans = await HubSpotBillingService.getAvailablePlans();
      setPlans(availablePlans);
      
      // Get current plan if user is logged in
      if (user) {
        const current = await HubSpotBillingService.getCurrentPlan();
        setCurrentPlan(current);
      }
    } catch (err) {
      setError('Failed to load pricing plans');
      console.error('Pricing page error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPlan = async (planId: string) => {
    if (!user) {
      // Redirect to login if not authenticated
      window.location.href = '/login?redirect=pricing';
      return;
    }

    try {
      setProcessingPlan(planId);
      
      if (currentPlan) {
        // User has a current plan, handle upgrade/downgrade
        const selectedPlan = plans.find(p => p.id === planId);
        if (selectedPlan && selectedPlan.price > currentPlan.price) {
          await HubSpotBillingService.upgradeSubscription(planId);
        } else {
          await HubSpotBillingService.downgradeSubscription(planId);
        }
      } else {
        // New subscription
        await HubSpotBillingService.createSubscription(planId);
      }
      
      // Redirect to billing dashboard
      window.location.href = '/settings?tab=billing';
    } catch (err) {
      setError('Failed to process subscription');
      console.error('Plan selection error:', err);
    } finally {
      setProcessingPlan(null);
    }
  };

  const getPlanIcon = (planId: string) => {
    switch (planId) {
      case 'starter':
        return <Zap className="h-6 w-6" />;
      case 'professional':
        return <Shield className="h-6 w-6" />;
      case 'enterprise':
        return <Crown className="h-6 w-6" />;
      default:
        return <CheckCircle className="h-6 w-6" />;
    }
  };

  const getPlanColor = (planId: string) => {
    switch (planId) {
      case 'starter':
        return 'border-green-200 bg-green-50';
      case 'professional':
        return 'border-purple-200 bg-purple-50';
      case 'enterprise':
        return 'border-yellow-200 bg-yellow-50';
      default:
        return 'border-gray-200 bg-gray-50';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading pricing plans...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Choose Your WorkflowGuard Plan
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Protect your HubSpot workflows with enterprise-grade version control, 
            automated backups, and instant rollback capabilities.
          </p>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-8 max-w-2xl mx-auto">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Pricing Cards */}
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 max-w-7xl mx-auto">
          {plans.map((plan) => {
            const isCurrentPlan = currentPlan?.id === plan.id;
            const isPopular = plan.id === 'professional';

            return (
              <Card 
                key={plan.id} 
                className={`relative ${isCurrentPlan ? 'ring-2 ring-primary' : ''} ${getPlanColor(plan.id)}`}
              >
                {isPopular && (
                  <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-purple-500 to-pink-500">
                    Most Popular
                  </Badge>
                )}
                
                {isCurrentPlan && (
                  <Badge className="absolute -top-3 right-4 bg-green-500">
                    Current Plan
                  </Badge>
                )}

                <CardHeader className="text-center pb-4">
                  <div className="flex justify-center mb-4">
                    <div className={`p-3 rounded-full ${getPlanColor(plan.id)}`}>
                      {getPlanIcon(plan.id)}
                    </div>
                  </div>
                  <CardTitle className="text-2xl font-bold">{plan.name}</CardTitle>
                  <CardDescription className="text-base">{plan.description}</CardDescription>
                  
                  <div className="mt-4">
                    <span className="text-4xl font-bold">
                      ${plan.price}
                    </span>
                    <span className="text-gray-500">/{plan.interval}</span>
                  </div>
                </CardHeader>

                <CardContent className="pt-0">
                  <ul className="space-y-3 mb-6">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start">
                        <CheckCircle className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    className={`w-full ${isPopular ? 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600' : ''}`}
                    variant={isCurrentPlan ? 'outline' : 'default'}
                    onClick={() => handleSelectPlan(plan.id)}
                    disabled={isCurrentPlan || processingPlan === plan.id}
                  >
                    {processingPlan === plan.id && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                    {isCurrentPlan ? 'Current Plan' : 'Get Started'}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Features Comparison */}
        <div className="mt-16">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Compare Features
            </h2>
            <p className="text-gray-600">
              See what's included in each plan
            </p>
          </div>

          <Card className="max-w-4xl mx-auto">
            <CardContent className="p-6">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-4 px-4 font-semibold">Feature</th>
                      {plans.map(plan => (
                        <th key={plan.id} className="text-center py-4 px-4 font-semibold">
                          {plan.name}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b">
                      <td className="py-4 px-4 font-medium">Workflows Protected</td>
                      {plans.map(plan => (
                        <td key={plan.id} className="text-center py-4 px-4">
                          {plan.id === 'starter' ? '10' : 
                           plan.id === 'professional' ? '35' : 'Unlimited'}
                        </td>
                      ))}
                    </tr>
                    <tr className="border-b">
                      <td className="py-4 px-4 font-medium">Version History</td>
                      {plans.map(plan => (
                        <td key={plan.id} className="text-center py-4 px-4">
                          {plan.id === 'starter' ? '30 days' : 
                           plan.id === 'professional' ? '90 days' : '1 year'}
                        </td>
                      ))}
                    </tr>
                    <tr className="border-b">
                      <td className="py-4 px-4 font-medium">Automated Backups</td>
                      {plans.map(plan => (
                        <td key={plan.id} className="text-center py-4 px-4">
                          {plan.id === 'starter' ? 'Manual' : 
                           <CheckCircle className="h-5 w-5 text-green-500 mx-auto" />}
                        </td>
                      ))}
                    </tr>
                    <tr className="border-b">
                      <td className="py-4 px-4 font-medium">Change Notifications</td>
                      {plans.map(plan => (
                        <td key={plan.id} className="text-center py-4 px-4">
                          {plan.id === 'starter' ? '-' : 
                           <CheckCircle className="h-5 w-5 text-green-500 mx-auto" />}
                        </td>
                      ))}
                    </tr>
                    <tr className="border-b">
                      <td className="py-4 px-4 font-medium">Advanced Rollback</td>
                      {plans.map(plan => (
                        <td key={plan.id} className="text-center py-4 px-4">
                          {plan.id === 'starter' ? 'Basic' : 
                           <CheckCircle className="h-5 w-5 text-green-500 mx-auto" />}
                        </td>
                      ))}
                    </tr>
                    <tr className="border-b">
                      <td className="py-4 px-4 font-medium">Compliance Reporting</td>
                      {plans.map(plan => (
                        <td key={plan.id} className="text-center py-4 px-4">
                          {plan.id === 'starter' ? '-' : 
                           plan.id === 'professional' ? 'Basic' : 'Advanced'}
                        </td>
                      ))}
                    </tr>
                    <tr className="border-b">
                      <td className="py-4 px-4 font-medium">Support</td>
                      {plans.map(plan => (
                        <td key={plan.id} className="text-center py-4 px-4">
                          {plan.id === 'starter' ? 'Email' : 
                           plan.id === 'professional' ? 'Priority WhatsApp' : '24/7 WhatsApp'}
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="py-4 px-4 font-medium">Team Members</td>
                      {plans.map(plan => (
                        <td key={plan.id} className="text-center py-4 px-4">
                          {plan.id === 'starter' ? '1' : 
                           plan.id === 'professional' ? '5' : 'Unlimited'}
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* FAQ Section */}
        <div className="mt-16 max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Can I change plans anytime?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Is there a free trial?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Yes! The Professional plan comes with a 21-day free trial. No credit card required to get started.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">How does billing work?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  We use HubSpot's secure billing system. You'll be charged monthly or annually based on your plan.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Can I cancel anytime?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Absolutely! You can cancel your subscription at any time with no cancellation fees.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-16 text-center">
          <Card className="max-w-2xl mx-auto bg-gradient-to-r from-blue-500 to-purple-600 text-white">
            <CardContent className="p-8">
              <h3 className="text-2xl font-bold mb-4">
                Ready to protect your workflows?
              </h3>
              <p className="text-blue-100 mb-6">
                Join thousands of HubSpot users who trust WorkflowGuard to keep their automation safe.
              </p>
              <Button 
                size="lg" 
                variant="secondary"
                onClick={() => handleSelectPlan('professional')}
                disabled={processingPlan === 'professional'}
              >
                {processingPlan === 'professional' && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Start Professional Trial
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 