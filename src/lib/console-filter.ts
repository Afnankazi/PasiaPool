/**
 * Console Error Filter
 * Hides specific errors from appearing in the browser console
 */

// Store original console methods
const originalError = console.error;
const originalWarn = console.warn;

// List of error patterns to hide
const HIDDEN_ERROR_PATTERNS = [
  'Failed to connect to MetaMask',
  'chrome-extension://nkbihfbeogaeaoehlefnkodbefgpgknn',
  'MetaMask connection failed',
  'ethereum provider not found',
  'wallet connection error'
];

// Check if error message should be hidden
const shouldHideError = (message: string): boolean => {
  return HIDDEN_ERROR_PATTERNS.some(pattern => 
    message.toLowerCase().includes(pattern.toLowerCase())
  );
};

// Override console.error
console.error = (...args: any[]) => {
  const message = args.join(' ');
  if (!shouldHideError(message)) {
    originalError.apply(console, args);
  }
};

// Override console.warn
console.warn = (...args: any[]) => {
  const message = args.join(' ');
  if (!shouldHideError(message)) {
    originalWarn.apply(console, args);
  }
};

// Export for manual restoration if needed
export const restoreConsole = () => {
  console.error = originalError;
  console.warn = originalWarn;
};

export const hideMetaMaskErrors = () => {
  // Already applied above
};