/**
 * Environment-aware Console Filter
 * Only filters in development, keeps all logs in production for debugging
 */

// Only apply filtering in development
if (process.env.NODE_ENV === 'development') {
  const originalError = console.error;
  const originalWarn = console.warn;

  const metamaskPatterns = [
    'Failed to connect to MetaMask',
    'chrome-extension://nkbihfbeogaeaoehlefnkodbefgpgknn',
    'MetaMask connection failed',
    'ethereum provider not found',
    'wallet connection error',
    'inpage.js',
    'scripts/inpage.js'
  ];

  const shouldHideMetaMaskError = (message: string): boolean => {
    return metamaskPatterns.some(pattern => 
      message.toLowerCase().includes(pattern.toLowerCase())
    );
  };

  console.error = (...args: any[]) => {
    const message = args.join(' ');
    if (!shouldHideMetaMaskError(message)) {
      originalError.apply(console, args);
    }
  };

  console.warn = (...args: any[]) => {
    const message = args.join(' ');
    if (!shouldHideMetaMaskError(message)) {
      originalWarn.apply(console, args);
    }
  };

  // Add a subtle indicator that filtering is active
  console.log('🔇 MetaMask console errors filtered in development');
}