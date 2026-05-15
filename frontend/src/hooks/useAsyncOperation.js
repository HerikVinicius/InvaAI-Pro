import { useState, useCallback, useRef, useEffect } from 'react';
import toast from 'react-hot-toast';
import { normalizeError, logError, retryWithBackoff } from '../utils/errorHandler';

/**
 * Enhanced async operation hook with comprehensive error handling
 * Handles loading, error states, retry logic, and user feedback
 *
 * @param {Function} asyncFn - The async function to execute
 * @param {Object} options - Configuration options
 *   - onSuccess: callback after successful execution
 *   - onError: callback after error
 *   - showErrorToast: show error in toast (default: true)
 *   - showSuccessToast: show success toast (default: false)
 *   - successMessage: custom success message
 *   - retryable: enable automatic retry (default: false)
 *   - maxRetries: max retry attempts (default: 3)
 *   - onRetry: callback on retry attempt
 *
 * @returns {Object} { loading, error, execute, reset, retry }
 *
 * @example
 * const { loading, error, execute } = useAsyncOperation(
 *   async (id) => await api.delete(`/users/${id}`),
 *   {
 *     onSuccess: () => toast.success('Deletado!'),
 *     retryable: true,
 *   }
 * );
 */
export function useAsyncOperation(asyncFn, options = {}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const isMountedRef = useRef(true);

  const {
    onSuccess,
    onError,
    showErrorToast = true,
    showSuccessToast = false,
    successMessage,
    retryable = false,
    maxRetries = 3,
    onRetry,
  } = options;

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const executeOperation = useCallback(
    async (...args) => {
      if (!isMountedRef.current) return;

      setLoading(true);
      setError(null);

      try {
        let result;

        if (retryable) {
          result = await retryWithBackoff(() => asyncFn(...args), {
            maxRetries,
            onRetry: (retryInfo) => {
              onRetry?.(retryInfo);
              if (import.meta.env.DEV) {
                console.log(`Retrying operation (attempt ${retryInfo.attempt + 1}/${maxRetries + 1})`);
              }
            },
          });
        } else {
          result = await asyncFn(...args);
        }

        if (isMountedRef.current) {
          if (showSuccessToast) {
            toast.success(successMessage || 'Operação realizada com sucesso.');
          }
          onSuccess?.(result);
        }

        return result;
      } catch (err) {
        if (!isMountedRef.current) return;

        const normalized = normalizeError(err);

        // Log error with context
        logError(err, {
          type: 'useAsyncOperation',
          operation: asyncFn.name || 'async',
          args,
        });

        setError(normalized);

        if (showErrorToast) {
          toast.error(normalized.message);
        }

        onError?.(normalized);

        throw normalized;
      } finally {
        if (isMountedRef.current) {
          setLoading(false);
        }
      }
    },
    [asyncFn, onSuccess, onError, showErrorToast, showSuccessToast, successMessage, retryable, maxRetries, onRetry]
  );

  const retry = useCallback(() => {
    return executeOperation();
  }, [executeOperation]);

  const reset = useCallback(() => {
    setLoading(false);
    setError(null);
  }, []);

  return {
    loading,
    error,
    execute: executeOperation,
    retry,
    reset,
  };
}

/**
 * Hook for managing multiple async operations with shared state
 * Useful when you need to track several concurrent operations
 */
export function useMultipleAsyncOperations(operations = {}) {
  const [states, setStates] = useState(
    Object.fromEntries(
      Object.keys(operations).map((key) => [
        key,
        { loading: false, error: null },
      ])
    )
  );

  const executeOperation = useCallback(
    async (operationKey, ...args) => {
      if (!operations[operationKey]) {
        console.error(`Operation '${operationKey}' not found`);
        return;
      }

      setStates((prev) => ({
        ...prev,
        [operationKey]: { loading: true, error: null },
      }));

      try {
        const result = await operations[operationKey](...args);

        return result;
      } catch (err) {
        const normalized = normalizeError(err);

        logError(err, {
          type: 'useMultipleAsyncOperations',
          operation: operationKey,
        });

        setStates((prev) => ({
          ...prev,
          [operationKey]: { loading: false, error: normalized },
        }));

        throw normalized;
      } finally {
        setStates((prev) => ({
          ...prev,
          [operationKey]: (p) => ({ ...p, loading: false }),
        }));
      }
    },
    [operations]
  );

  const reset = useCallback((operationKey) => {
    if (operationKey) {
      setStates((prev) => ({
        ...prev,
        [operationKey]: { loading: false, error: null },
      }));
    } else {
      setStates(
        Object.fromEntries(
          Object.keys(operations).map((key) => [
            key,
            { loading: false, error: null },
          ])
        )
      );
    }
  }, [operations]);

  return { states, executeOperation, reset };
}
