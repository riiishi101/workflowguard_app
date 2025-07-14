import React from 'react';

const Footer = () => (
  <footer className="w-full py-4 bg-gray-50 border-t text-center text-xs text-gray-500">
    <div className="flex flex-col md:flex-row items-center justify-center gap-2">
      <span>&copy; {new Date().getFullYear()} WorkflowGuard</span>
      <span className="mx-2">|</span>
      <a href="/privacy-policy.html" className="hover:underline">Privacy Policy</a>
      <span className="mx-2">|</span>
      <a href="/terms-of-service.html" className="hover:underline">Terms of Service</a>
    </div>
  </footer>
);

export default Footer; 