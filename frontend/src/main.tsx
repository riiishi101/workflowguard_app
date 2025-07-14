import React from 'react';
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Sentry integration
if (import.meta.env.PROD && import.meta.env.VITE_SENTRY_DSN) {
  import('@sentry/react').then(Sentry => {
    import('@sentry/tracing').then(({ BrowserTracing }) => {
      Sentry.init({
        dsn: import.meta.env.VITE_SENTRY_DSN,
        integrations: [new BrowserTracing()],
        tracesSampleRate: 0.1,
        environment: import.meta.env.MODE,
      });
    });
  });
}

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
