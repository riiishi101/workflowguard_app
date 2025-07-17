import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => (
  <footer className="w-full py-4 bg-gray-50 border-t text-center text-xs text-gray-500">
    <div className="flex flex-col md:flex-row items-center justify-center gap-2">
      <span>&copy; {new Date().getFullYear()} WorkflowGuard</span>
      <span className="mx-2">|</span>
      <Link to="/privacy-policy" className="hover:underline">Privacy Policy</Link>
      <span className="mx-2">|</span>
      <Link to="/terms-of-service" className="hover:underline">Terms of Service</Link>
      <span className="mx-2">|</span>
      <Link to="/contact-us" className="hover:underline">Contact Us</Link>
    </div>
  </footer>
);

export default Footer; 