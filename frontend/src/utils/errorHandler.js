/**
 * Centralized Error Handler Utilities
 * Provides consistent error handling, logging, and user feedback strategies
 */

const ERROR_TYPES = {
  NETWORK: 'NETWORK_ERROR',
  VALIDATION: 'VALIDATION_ERROR',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',
  SERVER: 'SERVER_ERROR',
  TIMEOUT: 'TIMEOUT',
  UNKNOWN: 'UNKNOWN_ERROR',
};

const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Falha de conexão. Verifique sua internet.',
  VALIDATION_ERROR: 'Dados inválidos. Verifique os campos.',
  UNAUTHORIZED: 'Sessão expirada. Faça login novamente.',
  FORBIDDEN: 'Acesso negado. Você não tem permissão.',
  NOT_FOUND: 'Recurso não encontrado.',
  CONFLICT: 'Conflito de dados. Tente novamente.',
  SERVER_ERROR: 'Erro no servidor. Tente novamente mais tarde.',
  TIMEOUT: 'Operação expirou. Tente novamente.',
  UNKNOWN_ERROR: 'Ocorreu um erro inesperado.',
};

/**
 * Normalizes and categorizes errors from various sources
 * Returns structured error object for consistent handling
 */
export function normalizeError(error) {
  let type = ERROR_TYPES.UNKNOWN;
  let message = ERROR_MESSAGES.UNKNOWN_ERROR;
  let status = null;
  let details = null;

  // Handle API errors from axios/error response
  if (error?.response) {
    status = error.response.status;
    details = error.response.data;

    if (status === 400) {
      type = ERROR_TYPES.VALIDATION;
      message = error.response.data?.message || ERROR_MESSAGES.VALIDATION_ERROR;
    } else if (status === 401) {
      type = ERROR_TYPES.UNAUTHORIZED;
      message = ERROR_MESSAGES.UNAUTHORIZED;
    } else if (status === 403) {
      type = ERROR_TYPES.FORBIDDEN;
      message = ERROR_MESSAGES.FORBIDDEN;
    } else if (status === 404) {
      type = ERROR_TYPES.NOT_FOUND;
      message = error.response.data?.message || ERROR_MESSAGES.NOT_FOUND;
    } else if (status === 409) {
      type = ERROR_TYPES.CONFLICT;
      message = error.response.data?.message || ERROR_MESSAGES.CONFLICT;
    } else if (status >= 500) {
      type = ERROR_TYPES.SERVER;
      message = ERROR_MESSAGES.SERVER_ERROR;
    }
  }
  // Handle network errors (no response)
  else if (error?.code === 'ECONNABORTED' || error?.code === 'ETIMEDOUT') {
    type = ERROR_TYPES.TIMEOUT;
    message = ERROR_MESSAGES.TIMEOUT;
  } else if (error?.message?.includes('Network') || error?.code === 'ERR_NETWORK') {
    type = ERROR_TYPES.NETWORK;
    message = ERROR_MESSAGES.NETWORK_ERROR;
  }
  // Handle custom Error objects with message property
  else if (error?.message) {
    message = error.message;
  }

  return {
    type,
    message,
    status,
    details,
    originalError: error,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Logs errors with appropriate severity and context
 * Useful for debugging and monitoring
 */
export function logError(error, context = {}) {
  const normalized = normalizeError(error);

  const logEntry = {
    timestamp: normalized.timestamp,
    type: normalized.type,
    message: normalized.message,
    status: normalized.status,
    context,
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
  };

  // Log to console in development
  if (import.meta.env.DEV) {
    const color = normalized.type === ERROR_TYPES.SERVER ? 'color: red;' : 'color: orange;';
    console.group(`%c[ERROR] ${normalized.type}`, color);
    console.error('Message:', normalized.message);
    console.error('Status:', normalized.status);
    console.error('Context:', context);
    console.error('Full error:', error);
    console.groupEnd();
  }

  // Store error in sessionStorage for crash reporting (max 10 errors)
  try {
    const stored = sessionStorage.getItem('app_errors') || '[]';
    const errors = JSON.parse(stored);
    errors.push(logEntry);
    if (errors.length > 10) errors.shift();
    sessionStorage.setItem('app_errors', JSON.stringify(errors));
  } catch (e) {
    // Silently fail if sessionStorage is full
  }

  // In production, send to error tracking service (e.g., Sentry)
  if (import.meta.env.PROD && window.__errorReporter) {
    window.__errorReporter(logEntry);
  }

  return normalized;
}

/**
 * Determines if an error is retryable based on its type and status code
 */
export function isRetryableError(error) {
  const normalized = normalizeError(error);

  // Retryable error codes
  const retryableStatuses = [408, 429, 500, 502, 503, 504];
  if (retryableStatuses.includes(normalized.status)) return true;

  // Retryable error types
  const retryableTypes = [ERROR_TYPES.NETWORK, ERROR_TYPES.TIMEOUT];
  if (retryableTypes.includes(normalized.type)) return true;

  return false;
}

/**
 * Implements exponential backoff retry strategy for async operations
 * Useful for flaky API calls or network operations
 */
export async function retryWithBackoff(
  asyncFn,
  {
    maxRetries = 3,
    initialDelay = 1000,
    maxDelay = 10000,
    backoffMultiplier = 2,
    onRetry = null,
  } = {}
) {
  let lastError;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await asyncFn();
    } catch (error) {
      lastError = error;

      if (attempt === maxRetries || !isRetryableError(error)) {
        throw error;
      }

      const delay = Math.min(
        initialDelay * Math.pow(backoffMultiplier, attempt),
        maxDelay
      );

      onRetry?.({ attempt, delay, error });

      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}

/**
 * Safe error getter that extracts user-friendly message from various error sources
 */
export function getErrorMessage(error, defaultMessage = 'Ocorreu um erro. Tente novamente.') {
  if (typeof error === 'string') return error;

  const normalized = normalizeError(error);
  return normalized.message || defaultMessage;
}

/**
 * Creates a structured error context for ErrorBoundary
 */
export function createErrorContext(error, errorInfo = {}) {
  const normalized = normalizeError(error);

  return {
    ...normalized,
    componentStack: errorInfo.componentStack,
    isRecoverable: normalized.type !== ERROR_TYPES.SERVER,
    canRetry: isRetryableError(error),
  };
}

export { ERROR_TYPES, ERROR_MESSAGES };
