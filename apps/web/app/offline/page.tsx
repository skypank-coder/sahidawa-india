'use client';

import { useEffect, useState } from 'react';

export default function OfflinePage() {
  const [isOnline, setIsOnline] = useState(false);

  useEffect(() => {
    setIsOnline(navigator.onLine);
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleRetry = () => {
    if (typeof window !== 'undefined') {
      window.location.href = '/';
    }
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-white px-6 text-center">
      <div className="max-w-md w-full">
        {/* Icon */}
        <div className="mx-auto mb-6 w-20 h-20 rounded-full bg-green-100 flex items-center justify-center">
          <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M18.364 5.636a9 9 0 010 12.728M15.536 8.464a5 5 0 010 7.072M12 12h.01M6.343 17.657a9 9 0 010-12.728" />
          </svg>
        </div>

        {/* English heading */}
        <h1 className="text-2xl font-bold text-gray-900 mb-1">You&apos;re Offline</h1>
        {/* Hindi heading */}
        <p className="text-lg font-medium text-green-700 mb-4">आप ऑफलाइन हैं</p>

        <p className="text-gray-500 text-sm mb-2">
          No internet connection detected. Some features may still be available from your recent activity.
        </p>
        <p className="text-gray-400 text-xs mb-8">
          इंटरनेट कनेक्शन नहीं मिला। हाल की जानकारी कैश से उपलब्ध हो सकती है।
        </p>

        {/* Tips */}
        <div className="bg-green-50 rounded-xl p-4 mb-6 text-left">
          <p className="text-xs font-semibold text-green-800 uppercase tracking-wide mb-2">What&apos;s available offline</p>
          <ul className="space-y-1 text-sm text-green-700">
            <li>✓ Recently looked up medicines</li>
            <li>✓ Previously loaded pharmacy locations</li>
            <li>✓ App pages you&apos;ve visited before</li>
          </ul>
        </div>

        {isOnline ? (
          <div className="mb-4 text-sm text-green-600 font-medium">
            ✓ Connection restored — you can go back
          </div>
        ) : null}

        <button
          onClick={handleRetry}
          className="w-full bg-green-600 hover:bg-green-700 active:bg-green-800 text-white font-semibold py-3 px-6 rounded-xl transition-colors duration-150"
        >
          Try Again / वापस जाएं
        </button>
      </div>
    </main>
  );
}
