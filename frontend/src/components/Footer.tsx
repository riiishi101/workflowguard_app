import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => (
  <footer className="w-full py-4 bg-gray-50 border-t text-xs text-gray-500">
    <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center md:items-center justify-between">
      <span className="mb-2 md:mb-0">&copy; {new Date().getFullYear()} WorkflowGuard. All rights reserved.</span>
      <div className="flex gap-8">
        <Link to="/terms-of-service" className="hover:underline">Terms of Service</Link>
        <Link to="/privacy-policy" className="hover:underline">Privacy Policy</Link>
        <Link to="/contact-us" className="hover:underline">Contact Us</Link>
      </div>
    </div>
  </footer>
);

export default Footer; 