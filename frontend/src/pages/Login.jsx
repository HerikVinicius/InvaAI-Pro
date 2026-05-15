import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AtSign, Lock, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore } from '../store/authStore';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';

export default function Login() {
  const navigate = useNavigate();
  const { login: loginUser, loading } = useAuthStore();
  const [form, setForm] = useState({ username: '', password: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.username || !form.password) {
      toast.error('Preencha username e senha.');
      return;
    }

    try {
      const result = await loginUser({
        username: form.username.trim().toLowerCase(),
        password: form.password,
      });
      if (result.success) {
        toast.success('Bem-vindo de volta!');
        setTimeout(() => navigate('/dashboard'), 500);
      } else {
        toast.error(result.message || 'Falha ao entrar.');
      }
    } catch (error) {
      toast.error('Ocorreu um erro. Tente novamente.');
      console.error(error);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-md bg-accent/15 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-accent" />
            </div>
            <span className="text-lg font-semibold text-accent">InvAI Pro</span>
          </div>
          <h1 className="text-2xl font-semibold text-text-primary">Bem-vindo de volta</h1>
          <p className="text-sm text-text-secondary mt-1">Acesse sua plataforma de inteligência de armazém</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-surface border border-border rounded-lg p-6 space-y-5">
          <Input
            label="Username"
            icon={AtSign}
            placeholder="seu.username"
            value={form.username}
            onChange={(e) => setForm({ ...form, username: e.target.value.toLowerCase() })}
            autoCapitalize="none"
            autoCorrect="off"
          />
          <Input
            label="Senha"
            type="password"
            icon={Lock}
            placeholder="••••••••"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
          <Button type="submit" loading={loading} className="w-full">
            Entrar
          </Button>
        </form>

        <div className="text-center mt-6 text-xs text-text-muted">
          <span className="inline-flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
            Status do Sistema: Ótimo
          </span>
          <div className="mt-3 max-w-xs mx-auto leading-relaxed">
            <span className="font-semibold text-text-secondary">Esqueceu a senha?</span>{' '}
            Não há recuperação por email.{' '}
            <span className="block mt-0.5">
              Vendedores: peça ao lojista para redefinir seu PIN.
              Lojistas: peça ao administrador.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
