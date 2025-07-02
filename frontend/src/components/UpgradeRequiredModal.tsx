import React from 'react';
import { X, Lock, Check } from 'lucide-react';

interface PremiumModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PremiumModal = ({ isOpen, onClose }: PremiumModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 relative">
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
          Unlock Premium Features
        </h2>

        {/* Subtitle */}
        <p className="text-gray-600 text-center mb-8 leading-relaxed">
          Get instant notifications and stay ahead of critical changes
        </p>

        {/* Features list */}
        <div className="space-y-4 mb-8">
          <div className="flex items-center space-x-3">
            <Check size={20} className="text-blue-600 flex-shrink-0" />
            <span className="text-gray-700">Real-time alerts for system updates</span>
          </div>
          <div className="flex items-center space-x-3">
            <Check size={20} className="text-blue-600 flex-shrink-0" />
            <span className="text-gray-700">Custom notification preferences</span>
          </div>
          <div className="flex items-center space-x-3">
            <Check size={20} className="text-blue-600 flex-shrink-0" />
            <span className="text-gray-700">Priority notifications for critical events</span>
          </div>
        </div>

        {/* Upgrade button */}
        <button
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-6 rounded-xl transition-colors mb-6"
          onClick={() => window.location.href = '/settings?tab=plan-billing'}
        >
          Upgrade Now
        </button>

        {/* Bottom links */}
        <div className="flex justify-between items-center text-sm">
          <button className="text-blue-600 hover:text-blue-700 font-medium">
            View Plan Details
          </button>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 font-medium"
          >
            Back to Settings
          </button>
        </div>
      </div>
    </div>
  );
};

export default PremiumModal; 