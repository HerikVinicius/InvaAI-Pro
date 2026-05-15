import toast from 'react-hot-toast';
import { normalizeError, logError } from '../utils/errorHandler';

/**
 * Enhanced API interceptors with comprehensive error handling
 * Provides centralized error logging, user feedback, and recovery strategies
 */

export function setupApiInterceptors(api) {
  // Request interceptor: log outgoing requests in development
  api.interceptors.request.use(
    (config) => {
      if (import.meta.env.DEV) {
        console.log(`[API Request] ${config.method?.toUpperCase()} ${config.url}`);
      }
      return config;
    },
    (error) => {
      logError(error, { type: 'ApiRequest', phase: 'request' });
      return Promise.reject(error);
    }
  );

  // Response interceptor: handle errors with context and recovery
  api.interceptors.response.use(
    (response) => {
      if (import.meta.env.DEV) {
        console.log(`[API Response] ${response.status} ${response.config.url}`);
      }
      return response.data;
    },
    (error) => {
      const normalized = normalizeError(error);

      // Extract response data if available
      const data = error.response?.data || {};
      const message = normalized.message;
      const status = error.response?.status;

      // Handle specific status codes with context-aware messages
      if (status === 401) {
        // Unauthorized: clear auth and redirect
        localStorage.removeItem('invaai_token');
        localStorage.removeItem('invaai_user');

        // Only show toast if not already on login page
        if (window.location.pathname !== '/login') {
          toast.error('Sua sessão expirou. Faça login novamente.');
          setTimeout(() => {
            window.location.href = '/login';
          }, 1500);
        }
      } else if (status === 403) {
        // Forbidden: user lacks permissions
        toast.error(message || 'Você não tem permissão para acessar este recurso.');
        logError(error, {
          type: 'ApiResponse',
          phase: 'forbidden',
          endpoint: error.config?.url,
        });
      } else if (status === 404) {
        // Not Found: resource doesn't exist
        logError(error, {
          type: 'ApiResponse',
          phase: 'not_found',
          endpoint: error.config?.url,
        });
        // Don't show toast for 404s - let caller handle it
      } else if (status === 409) {
        // Conflict: data conflict (e.g., duplicate entry)
        toast.error(message || 'Conflito de dados. O recurso pode ter sido modificado.');
        logError(error, {
          type: 'ApiResponse',
          phase: 'conflict',
          endpoint: error.config?.url,
        });
      } else if (status === 422) {
        // Validation error: detailed feedback available
        if (data.errors) {
          const errorMessages = Object.entries(data.errors)
            .map(([field, msgs]) => `${field}: ${Array.isArray(msgs) ? msgs[0] : msgs}`)
            .join('\n');
          toast.error(errorMessages, {
            duration: 5000,
          });
        } else {
          toast.error(message || 'Erro de validação. Verifique os dados.');
        }
        logError(error, {
          type: 'ApiResponse',
          phase: 'validation',
          endpoint: error.config?.url,
          errors: data.errors,
        });
      } else if (status >= 500) {
        // Server error: inform user to retry later
        toast.error('Erro no servidor. Tente novamente em alguns momentos.');
        logError(error, {
          type: 'ApiResponse',
          phase: 'server_error',
          endpoint: error.config?.url,
          status,
        });
      } else if (!error.response) {
        // Network error: no response from server
        toast.error('Falha de conexão. Verifique sua internet.');
        logError(error, {
          type: 'ApiResponse',
          phase: 'network_error',
          endpoint: error.config?.url,
        });
      }

      // Return structured error that preserves original data
      // This allows callers to branch on machine-readable error codes
      return Promise.reject({
        type: normalized.type,
        message: normalized.message,
        status: normalized.status,
        ...data, // Include server response data (code, pendingCaixa, etc.)
        originalError: error,
      });
    }
  );
}

/**
 * Creates a wrapped API client with automatic error handling
 * Useful for services that want to avoid boilerplate try/catch
 */
export function createSafeApiClient(api, { showErrors = true } = {}) {
  return {
    get: async (url, config) => {
      try {
        return await api.get(url, config);
      } catch (error) {
        if (showErrors && !error.handled) {
          logError(error, { method: 'GET', url });
        }
        throw error;
      }
    },
    post: async (url, data, config) => {
      try {
        return await api.post(url, data, config);
      } catch (error) {
        if (showErrors && !error.handled) {
          logError(error, { method: 'POST', url });
        }
        throw error;
      }
    },
    put: async (url, data, config) => {
      try {
        return await api.put(url, data, config);
      } catch (error) {
        if (showErrors && !error.handled) {
          logError(error, { method: 'PUT', url });
        }
        throw error;
      }
    },
    patch: async (url, data, config) => {
      try {
        return await api.patch(url, data, config);
      } catch (error) {
        if (showErrors && !error.handled) {
          logError(error, { method: 'PATCH', url });
        }
        throw error;
      }
    },
    delete: async (url, config) => {
      try {
        return await api.delete(url, config);
      } catch (error) {
        if (showErrors && !error.handled) {
          logError(error, { method: 'DELETE', url });
        }
        throw error;
      }
    },
  };
}
