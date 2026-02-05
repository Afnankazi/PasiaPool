/**
 * Console Filter Component
 * Client-side component to hide console errors
 */

'use client';

import { useEffect } from 'react';

const ConsoleFilter = () => {
  useEffect(() => {
    // Store original console methods
    const originalError = console.error;
    const originalWarn = console.warn;

    // Error patterns to hide
    const hiddenPatterns = [
      'Failed to connect to MetaMask',
      'chrome-extension://nkbihfbeogaeaoehlefnkodbefgpgknn',
      'MetaMask connection failed',
      'ethereum provider not found',
      'wallet connection error',
      'inpage.js'
    ];

    // Check if error should be hidden
    const shouldHide = (message: string) => {
      return hiddenPatterns.some(pattern => 
        message.toLowerCase().includes(pattern.toLowerCase())
      );
    };

    // Override console.error
    console.error = (...args: any[]) => {
      const message = args.join(' ');
      if (!shouldHide(message)) {
        originalError.apply(console, args);
      }
    };

    // Override console.warn
    console.warn = (...args: any[]) => {
      const message = args.join(' ');
      if (!shouldHide(message)) {
        originalWarn.apply(console, args);
      }
    };

    // Cleanup on unmount
    return () => {
      console.error = originalError;
      console.warn = originalWarn;
    };
  }, []);

  return null; // This component doesn't render anything
};

export default ConsoleFilter;