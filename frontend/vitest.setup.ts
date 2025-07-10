import '@testing-library/jest-dom'; 
// Mock getBoundingClientRect for all elements to avoid zero width/height warnings in chart tests
if (typeof window !== 'undefined' && window.HTMLElement) {
  window.HTMLElement.prototype.getBoundingClientRect = function () {
    return {
      width: 300,
      height: 150,
      top: 0,
      left: 0,
      bottom: 150,
      right: 300,
      x: 0,
      y: 0,
      toJSON: () => {},
    };
  };
} 
// Mock /me endpoint globally to avoid 429 errors in tests
if (typeof window !== 'undefined') {
  const originalFetch = window.fetch;
  window.fetch = async (input, init) => {
    if (typeof input === 'string' && input.includes('/me')) {
      const body = JSON.stringify({
        id: 'test-user',
        email: 'test@example.com',
        role: 'admin',
        hubspotPortalId: '12345',
      });
      return new Response(body, {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    return originalFetch(input, init);
  };
} 
// Mock additional API endpoints globally
if (typeof window !== 'undefined') {
  const originalFetch = window.fetch;
  window.fetch = async (input, init) => {
    if (typeof input === 'string') {
      if (input.includes('/me')) {
        const body = JSON.stringify({
          id: 'test-user',
          email: 'test@example.com',
          role: 'admin',
          hubspotPortalId: '12345',
        });
        return new Response(body, {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      if (input.includes('/api/analytics')) {
        const body = JSON.stringify({
          totalWorkflows: 10,
          totalRevenue: 1000,
          data: [],
        });
        return new Response(body, {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      if (input.includes('/api/workflows')) {
        const body = JSON.stringify({
          workflows: [],
        });
        return new Response(body, {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      if (input.includes('/api/billing')) {
        const body = JSON.stringify({
          plan: 'pro',
          status: 'active',
        });
        return new Response(body, {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }
    return originalFetch(input, init);
  };
} 
// Suppress React Router v7, chart fixed size, and act() environment warnings in test output
const originalWarn = console.warn;
const originalError = console.error;
console.warn = (...args) => {
  if (
    typeof args[0] === 'string' &&
    (
      args[0].includes('React Router will begin wrapping state updates') ||
      args[0].includes('Relative route resolution within Splat routes is changing in v7') ||
      args[0].includes('The width(240) and height(240) are both fixed numbers')
    )
  ) {
    return;
  }
  originalWarn(...args);
};
console.error = (...args) => {
  if (
    typeof args[0] === 'string' &&
    (
      args[0].includes('act(...)') ||
      args[0].includes('The current testing environment is not configured to support act')
    )
  ) {
    return;
  }
  originalError(...args);
}; 