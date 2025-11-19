/**
 * Secure error handling utilities
 * Prevents leaking sensitive information to users
 */

/**
 * Gets a safe error message for display to users
 * Never exposes sensitive information like stack traces, API keys, etc.
 */
export const getSafeErrorMessage = (error: unknown, defaultMessage: string = 'Er is een fout opgetreden.'): string => {
  // In production, never expose detailed error information
  if (import.meta.env.PROD) {
    return defaultMessage;
  }
  
  // In development, show more details for debugging
  if (error instanceof Error) {
    // Filter out sensitive information
    const message = error.message;
    
    // Don't expose API keys, tokens, or internal paths
    if (
      message.includes('API_KEY') ||
      message.includes('SECRET') ||
      message.includes('TOKEN') ||
      message.includes('PASSWORD') ||
      message.includes('supabase') ||
      message.includes('localhost')
    ) {
      return defaultMessage;
    }
    
    return message;
  }
  
  if (typeof error === 'string') {
    return error;
  }
  
  return defaultMessage;
};

/**
 * Logs errors securely without exposing sensitive information
 */
export const logError = (error: unknown, context?: string): void => {
  const timestamp = new Date().toISOString();
  const contextStr = context ? `[${context}]` : '';
  
  if (error instanceof Error) {
    console.error(`${timestamp} ${contextStr}`, {
      message: error.message,
      name: error.name,
      // Don't log stack traces in production
      stack: import.meta.env.DEV ? error.stack : undefined,
    });
  } else {
    console.error(`${timestamp} ${contextStr}`, error);
  }
};




