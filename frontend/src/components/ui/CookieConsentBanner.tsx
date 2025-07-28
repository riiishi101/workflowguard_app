import React, { useEffect, useState } from 'react';

const COOKIE_CONSENT_KEY = 'cookie_consent_accepted';

const CookieConsentBanner: React.FC = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!consent) setVisible(true);
  }, []);

  const acceptCookies = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, 'true');
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 w-full z-50 bg-gray-900 text-white px-4 py-3 flex flex-col md:flex-row items-center justify-between shadow-lg animate-fade-in">
      <span className="mb-2 md:mb-0 text-sm">
        This site uses cookies to enhance your experience and for analytics. By using WorkflowGuard, you agree to our{' '}
        <a href="/privacy-policy.html" className="underline hover:text-blue-300">Privacy Policy</a>.
      </span>
      <button
        onClick={acceptCookies}
        className="ml-0 md:ml-4 mt-2 md:mt-0 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-sm font-semibold transition-colors"
      >
        Accept
      </button>
    </div>
  );
};

export default CookieConsentBanner; 