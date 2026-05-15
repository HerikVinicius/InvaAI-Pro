import { useEffect, useState } from 'react';
import { Key, Eye, EyeOff, RefreshCw, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import Modal from '../ui/Modal';
import Button from '../ui/Button';

/**
 * Generates a random 12-char password with mixed character classes.
 * Used by the "gerar senha" button to spare the operator from
 * inventing a strong password manually.
 */
const generatePassword = () => {
  const lowers = 'abcdefghjkmnpqrstuvwxyz';
  const uppers = 'ABCDEFGHJKMNPQRSTUVWXYZ';
  const digits = '23456789';
  const symbols = '@#$%&*!';
  const all = lowers + uppers + digits + symbols;

  const pick = (s) => s[Math.floor(Math.random() * s.length)];
  // guarantee at least one of each
  const required = [pick(lowers), pick(uppers), pick(digits), pick(symbols)];
  const rest = Array.from({ length: 8 }, () => pick(all));
  return [...required, ...rest].sort(() => Math.random() - 0.5).join('');
};

export default function ResetPasswordModal({ open, onClose, user, onReset }) {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [show, setShow] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setPassword('');
      setConfirm('');
      setShow(false);
    }
  }, [open]);

  if (!user) return null;

  const tooShort = password.length > 0 && password.length < 8;
  const mismatch = password && confirm && password !== confirm;
  const canSubmit = password.length >= 8 && password === confirm && !submitting;

  const handleGenerate = () => {
    const pwd = generatePassword();
    setPassword(pwd);
    setConfirm(pwd);
    setShow(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;

    setSubmitting(true);
    try {
      await api.post(`/users/${user._id}/reset-password`, { newPassword: password });
      toast.success(`Senha de @${user.username} redefinida.`);
      onReset?.(password);
      onClose();
    } catch (err) {
      toast.error(err.message || 'Falha ao redefinir senha.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Redefinir Senha" size="sm">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-md p-3 flex gap-3 text-xs">
          <AlertTriangle className="w-4 h-4 text-amber-300 flex-shrink-0 mt-0.5" />
          <div className="text-text-secondary">
            Esta ação define uma nova senha imediatamente.
            <strong className="block text-amber-200 mt-1">
              Anote ou copie a senha antes de fechar — ela não pode ser recuperada depois.
            </strong>
          </div>
        </div>

        <div className="bg-surface-elevated border border-border rounded-md p-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-accent/15 text-accent flex items-center justify-center text-xs font-semibold">
            {user.name?.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()}
          </div>
          <div className="min-w-0">
            <div className="text-sm font-medium truncate">{user.name}</div>
            <div className="text-xs text-text-muted data-mono">@{user.username}</div>
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <label className="label-caps">Nova Senha</label>
            <button
              type="button"
              onClick={handleGenerate}
              className="text-xs text-accent hover:text-accent-hover inline-flex items-center gap-1"
            >
              <RefreshCw className="w-3 h-3" />
              Gerar
            </button>
          </div>
          <div className="relative">
            <input
              type={show ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="mínimo 8 caracteres"
              autoFocus
              className="w-full bg-background border border-border rounded-md px-3 py-2 pr-10 text-sm font-mono focus:outline-none focus:border-accent"
            />
            <button
              type="button"
              onClick={() => setShow((s) => !s)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary"
            >
              {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {tooShort && (
            <span className="text-xs text-status-critical">Mínimo 8 caracteres.</span>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="label-caps">Confirmar Senha</label>
          <input
            type={show ? 'text' : 'password'}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="repita a senha"
            className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm font-mono focus:outline-none focus:border-accent"
          />
          {mismatch && (
            <span className="text-xs text-status-critical">As senhas não coincidem.</span>
          )}
        </div>

        <div className="flex gap-2 justify-end pt-2 border-t border-border">
          <Button type="button" variant="secondary" onClick={onClose} disabled={submitting}>
            Cancelar
          </Button>
          <Button type="submit" icon={Key} loading={submitting} disabled={!canSubmit}>
            Redefinir Senha
          </Button>
        </div>
      </form>
    </Modal>
  );
}
