import React from 'react';
import { X, Lock, Check, ExternalLink, Star, Zap } from 'lucide-react';
import { useAuth } from './AuthContext';

interface PremiumModalProps {
  isOpen: boolean;
  onClose: () => void;
  feature?: string;
  isTrialing?: boolean;
  planId?: string;
  trialPlanId?: string;
  message?: string;
}

const PremiumModal = ({ isOpen, onClose, feature, isTrialing, planId, trialPlanId, message }: PremiumModalProps) => {
  const { user } = useAuth();

  if (!isOpen) return null;

  let displayMessage = message;
  if (!displayMessage) {
    if (isTrialing && trialPlanId === 'professional') {
      displayMessage = `This feature is part of the Professional plan. Enjoy full access during your free trial! Upgrade to keep using it after your trial ends.`;
    } else {
      displayMessage = `Upgrade your plan to unlock ${feature || 'this feature'}.`;
    }
  }

  const handleUpgradeViaHubSpot = (planId: string) => {
    const hubspotUrl = user?.hubspotPortalId
      ? `https://app.hubspot.com/ecosystem/${user.hubspotPortalId}/marketplace/apps`
      : 'https://app.hubspot.com/ecosystem/marketplace/apps';
    
    window.open(hubspotUrl, '_blank');
    onClose();
  };

  const plans = [
    {
      id: 'starter',
      name: 'Starter',
      price: 29,
      description: 'Perfect for small teams',
      features: [
        '50 Workflows',
        '30 Days History',
        'Basic Monitoring',
        'Email Support'
      ],
      popular: false,
      recommended: false,
    },
    {
      id: 'professional',
      name: 'Professional',
      price: 59,
      description: 'For growing businesses',
      features: [
        '500 Workflows',
        '90 Days History',
        'Advanced Monitoring',
        'Priority Support',
        'Custom Notifications'
      ],
      popular: true,
      recommended: true,
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      price: 199,
      description: 'Enterprise solution',
      features: [
        'Unlimited Workflows',
        'Unlimited History',
        '24/7 Support',
        'API Access',
        'User Permissions'
      ],
      popular: false,
      recommended: false,
    },
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" data-testid="upgrade-modal">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full p-8 relative max-h-[90vh] overflow-y-auto">
        {/* Close button */}
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X size={24} />
        </button>

        {/* Lock icon */}
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center">
            <Lock size={32} className="text-blue-600" />
          </div>
        </div>

        {/* Title */}
        <h2 className="text-2xl font-bold text-gray-900 text-center mb-4">
          Choose Your Plan
        </h2>

        {/* Subtitle */}
        <p className="text-gray-600 text-center mb-8 leading-relaxed">
          {displayMessage}
        </p>

        {/* Plan Options */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {plans.map((plan) => (
            <div 
              key={plan.id}
              className={`border rounded-xl p-6 relative ${
                plan.popular 
                  ? 'border-blue-500 ring-2 ring-blue-500' 
                  : 'border-gray-200'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="bg-blue-500 text-white text-xs px-3 py-1 rounded-full font-medium">
                    Most Popular
                  </span>
                </div>
              )}
              {plan.recommended && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="bg-green-500 text-white text-xs px-3 py-1 rounded-full font-medium">
                    Recommended
                  </span>
                </div>
              )}

              <div className="text-center mb-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{plan.name}</h3>
                <div className="text-3xl font-bold text-blue-600 mb-1">${plan.price}</div>
                <div className="text-sm text-gray-600 mb-2">/month</div>
                <p className="text-xs text-gray-500">{plan.description}</p>
              </div>

              <ul className="space-y-3 mb-6">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-center space-x-3">
                    <Check size={16} className="text-green-500 flex-shrink-0" />
                    <span className="text-sm text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleUpgradeViaHubSpot(plan.id)}
                className={`w-full py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center ${
                  plan.popular
                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-900 border border-gray-300'
                }`}
              >
                <ExternalLink size={16} className="mr-2" />
                Choose {plan.name}
              </button>
            </div>
          ))}
        </div>

        {/* Additional Info */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-center space-x-4 text-sm text-gray-600">
            <div className="flex items-center space-x-2">
              <Zap className="w-4 h-4 text-yellow-500" />
              <span>No setup fees</span>
            </div>
            <div className="flex items-center space-x-2">
              <Check className="w-4 h-4 text-green-500" />
              <span>Cancel anytime</span>
            </div>
            <div className="flex items-center space-x-2">
              <Star className="w-4 h-4 text-blue-500" />
              <span>14-day money back</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-6">
          <p className="text-xs text-gray-500">
            All plans include core workflow protection features. 
            Billing is managed through HubSpot Marketplace.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PremiumModal; 