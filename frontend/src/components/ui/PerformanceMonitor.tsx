import React, { useEffect, useState } from 'react';

interface PerformanceMetrics {
  pageLoadTime: number;
  apiResponseTime: number;
  domContentLoaded: number;
  firstContentfulPaint: number;
}

const PerformanceMonitor: React.FC = () => {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);

  useEffect(() => {
    // Only run in development
    if (process.env.NODE_ENV !== 'development') {
      return;
    }

    const measurePerformance = () => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      const paint = performance.getEntriesByType('paint');
      
      const firstContentfulPaint = paint.find(entry => entry.name === 'first-contentful-paint');
      
      const performanceMetrics: PerformanceMetrics = {
        pageLoadTime: navigation.loadEventEnd - navigation.loadEventStart,
        apiResponseTime: 0, // Will be updated by API calls
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
        firstContentfulPaint: firstContentfulPaint ? firstContentfulPaint.startTime : 0,
      };

      setMetrics(performanceMetrics);

      // Log performance metrics
      console.log('🚀 Performance Metrics:', {
        'Page Load Time': `${performanceMetrics.pageLoadTime.toFixed(2)}ms`,
        'DOM Content Loaded': `${performanceMetrics.domContentLoaded.toFixed(2)}ms`,
        'First Contentful Paint': `${performanceMetrics.firstContentfulPaint.toFixed(2)}ms`,
      });

      // Warn if performance is poor
      if (performanceMetrics.pageLoadTime > 3000) {
        console.warn('⚠️ Slow page load detected:', performanceMetrics.pageLoadTime.toFixed(2), 'ms');
      }
    };

    // Wait for page to fully load
    if (document.readyState === 'complete') {
      measurePerformance();
    } else {
      window.addEventListener('load', measurePerformance);
      return () => window.removeEventListener('load', measurePerformance);
    }
  }, []);

  // Don't render anything in production
  if (process.env.NODE_ENV !== 'development' || !metrics) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 bg-black bg-opacity-75 text-white p-3 rounded text-xs font-mono z-50">
      <div className="mb-1">🚀 Performance</div>
      <div>Page Load: {metrics.pageLoadTime.toFixed(0)}ms</div>
      <div>DOM Ready: {metrics.domContentLoaded.toFixed(0)}ms</div>
      <div>FCP: {metrics.firstContentfulPaint.toFixed(0)}ms</div>
    </div>
  );
};

export default PerformanceMonitor; 