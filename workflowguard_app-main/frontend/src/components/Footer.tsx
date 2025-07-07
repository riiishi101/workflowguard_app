import React from 'react';

const Footer = () => (
  <footer className="border-t border-gray-200 bg-white w-full py-6 px-4 flex flex-col items-center text-sm text-gray-500">
    <div className="flex flex-col md:flex-row items-center gap-2 md:gap-4">
      <span>&copy; {new Date().getFullYear()} WorkflowGuard. All rights reserved.</span>
      <span className="hidden md:inline">|</span>
      <a
        href="/privacy-policy.html"
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-600 hover:underline transition-colors"
      >
        Privacy Policy
      </a>
      {/* Uncomment if you add a terms page:
      <span className="hidden md:inline">|</span>
      <a href="/terms.html" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline transition-colors">Terms of Service</a>
      */}
    </div>
  </footer>
);

export default Footer; 