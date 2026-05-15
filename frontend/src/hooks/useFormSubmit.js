import { useState } from 'react';
import toast from 'react-hot-toast';

/**
 * Hook para gerenciar submissão de formulários
 * Centraliza lógica de loading, erro e sucesso
 *
 * @param {Function} onSubmit - função assíncrona que executa a operação
 * @param {Object} options - configurações opcionais
 *   - successMessage: mensagem de sucesso (default: 'Operação realizada.')
 *   - errorMessage: mensagem de erro genérica (default: 'Falha na operação.')
 *   - onSuccess: callback após sucesso
 *   - onError: callback após erro
 *   - showErrorToast: mostrar erro em toast (default: true)
 *
 * @returns {Object} { submitting, handleSubmit, reset }
 *
 * @example
 * const { submitting, handleSubmit } = useFormSubmit(
 *   async () => {
 *     if (!form.name) throw new Error('Nome é obrigatório.');
 *     await api.post('/users', form);
 *   },
 *   {
 *     successMessage: 'Usuário criado com sucesso.',
 *     onSuccess: () => onSaved(),
 *   }
 * );
 *
 * return (
 *   <form onSubmit={handleSubmit}>
 *     <input value={form.name} onChange={...} />
 *     <button type="submit" disabled={submitting}>
 *       {submitting ? 'Enviando...' : 'Enviar'}
 *     </button>
 *   </form>
 * );
 */
export function useFormSubmit(onSubmit, options = {}) {
  const [submitting, setSubmitting] = useState(false);
  const {
    successMessage = 'Operação realizada.',
    errorMessage = 'Falha na operação.',
    onSuccess,
    onError,
    showErrorToast = true,
  } = options;

  const handleSubmit = async (e) => {
    // Permite usar com ou sem event
    e?.preventDefault?.();

    // Evita múltiplas submissões
    if (submitting) return;

    setSubmitting(true);

    try {
      await onSubmit();
      toast.success(successMessage);
      onSuccess?.();
    } catch (err) {
      const msg = err.message || errorMessage;
      if (showErrorToast) {
        toast.error(msg);
      }
      onError?.(err);
    } finally {
      setSubmitting(false);
    }
  };

  const reset = () => {
    setSubmitting(false);
  };

  return { submitting, handleSubmit, reset };
}

/**
 * Hook para gerenciar operações assíncronas genéricas
 * Útil para fetch, delete, etc
 *
 * @example
 * const { loading, error, execute } = useAsync(
 *   async (userId) => {
 *     await api.delete(`/users/${userId}`);
 *   },
 *   {
 *     successMessage: 'Usuário deletado.',
 *     onSuccess: () => refetch(),
 *   }
 * );
 *
 * return (
 *   <button onClick={() => execute(userId)} disabled={loading}>
 *     {loading ? 'Deletando...' : 'Deletar'}
 *   </button>
 * );
 */
export function useAsync(asyncFn, options = {}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const {
    successMessage,
    errorMessage = 'Falha na operação.',
    onSuccess,
    onError,
  } = options;

  const execute = async (...args) => {
    setLoading(true);
    setError(null);

    try {
      const result = await asyncFn(...args);
      if (successMessage) {
        toast.success(successMessage);
      }
      onSuccess?.(result);
      return result;
    } catch (err) {
      const msg = err.message || errorMessage;
      setError(msg);
      toast.error(msg);
      onError?.(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setLoading(false);
    setError(null);
  };

  return { loading, error, execute, reset };
}
