import React, { useEffect, useState } from "react";

interface SuccessErrorBannerProps {
  type: "success" | "error";
  message: string;
  onClose?: () => void;
  duration?: number; // in ms
}

const SuccessErrorBanner: React.FC<SuccessErrorBannerProps> = ({ type, message, onClose, duration = 7000 }) => {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (!visible) return;
    const timer = setTimeout(() => {
      setVisible(false);
      onClose && onClose();
    }, duration);
    return () => clearTimeout(timer);
  }, [visible, duration, onClose]);

  if (!visible) return null;

  return (
    <div
      className={`mb-6 p-4 rounded flex items-center justify-between border ${
        type === "success"
          ? "bg-green-50 border-green-300"
          : "bg-red-50 border-red-300"
      }`}
    >
      <div className="flex items-center gap-2">
        {type === "success" ? (
          <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2l4-4"/></svg>
        ) : (
          <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 9l-6 6M9 9l6 6"/></svg>
        )}
        <span className={type === "success" ? "text-green-700 font-medium" : "text-red-700 font-medium"}>{message}</span>
      </div>
      <button onClick={() => { setVisible(false); onClose && onClose(); }} className={type === "success" ? "text-green-700 hover:text-green-900 text-lg font-bold px-2" : "text-red-700 hover:text-red-900 text-lg font-bold px-2"}>×</button>
    </div>
  );
};

export default SuccessErrorBanner; 