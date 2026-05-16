import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AtSign, Lock, User, Sparkles, Store } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore } from '../store/authStore';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';

// Mirrors backend slugifyTenant — preview of the auto-generated tenant id.
const previewTenantId = (name) =>
  (name || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .substring(0, 40);

// Mirrors the backend USERNAME_REGEX — must match the User schema.
const USERNAME_REGEX = /^(?![._])(?!.*[._]$)[a-z0-9._]{3,30}$/;

// Auto-suggests a username from the store name, stripping invalid chars.
const suggestUsername = (name) =>
  (name || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-z0-9._]/g, '.')
    .replace(/\.+/g, '.')
    .replace(/^[._]+|[._]+$/g, '')
    .substring(0, 30);

export default function Register() {
  const navigate = useNavigate();
  const { register: registerUser, loading } = useAuthStore();
  const [form, setForm] = useState({
    name: '',
    username: '',
    password: '',
  });
  const [usernameTouched, setUsernameTouched] = useState(false);

  // Auto-suggest username when the user types the store name (until they edit username manually).
  useEffect(() => {
    if (!usernameTouched) {
      setForm((f) => ({ ...f, username: suggestUsername(f.name) }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.name]);

  const tenantPreview = previewTenantId(form.name);
  const usernameValid = !form.username || USERNAME_REGEX.test(form.username);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.username || !form.password) {
      toast.error('Preencha todos os campos.');
      return;
    }
    if (!USERNAME_REGEX.test(form.username)) {
      toast.error('Username inválido — use 3-30 letras, números, "." ou "_".');
      return;
    }
    if (form.password.length < 4) {
      toast.error('A senha deve ter pelo menos 4 caracteres.');
      return;
    }

    try {
      const result = await registerUser(form);
      if (result.success) {
        toast.success('Conta criada! Banco de dados isolado configurado.');
        setTimeout(() => navigate('/dashboard'), 500);
      } else {
        toast.error(result.message || 'Falha no registro.');
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
          <h1 className="text-2xl font-semibold text-text-primary">Criar sua conta</h1>
          <p className="text-sm text-text-secondary mt-1">Comece a gerenciar suas operações de armazém hoje</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-surface border border-border rounded-lg p-6 space-y-5">
          <div>
            <Input
              label="Nome da Loja"
              icon={Store}
              placeholder="Loja do João"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
            {tenantPreview && (
              <div className="mt-1 text-xs text-text-muted">
                Banco isolado: <span className="font-mono text-accent">invaai_{tenantPreview}</span>
              </div>
            )}
          </div>

          <div>
            <Input
              label="Username (para login)"
              icon={AtSign}
              placeholder="seu.username"
              value={form.username}
              onChange={(e) => {
                setUsernameTouched(true);
                setForm({ ...form, username: e.target.value.toLowerCase() });
              }}
              autoCapitalize="none"
              autoCorrect="off"
            />
            <div className={`mt-1 text-xs ${form.username && !usernameValid ? 'text-status-critical' : 'text-text-muted'}`}>
              {form.username && !usernameValid
                ? 'Username inválido — use 3-30 letras, números, "." ou "_".'
                : '3-30 letras, números, "." ou "_". Será seu login no sistema.'}
            </div>
          </div>

          <Input
            label="Senha (mín. 4 caracteres)"
            type="password"
            icon={Lock}
            placeholder="••••"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />

          <div className="bg-accent/5 border border-accent/20 rounded-md p-3 text-xs text-text-secondary">
            <span className="font-semibold text-accent">ℹ Sua conta será criada como Lojista.</span>
            {' '}Um banco de dados isolado e vazio será automaticamente criado para sua loja.
            {' '}Você poderá cadastrar produtos, vendedores e vendas após o login.
          </div>

          <Button type="submit" loading={loading} className="w-full">
            Criar Conta
          </Button>

          <div className="text-center text-sm text-text-secondary">
            Já tem uma conta?{' '}
            <Link to="/login" className="text-accent hover:text-accent-hover">Entrar</Link>
          </div>
        </form>
      </div>
    </div>
  );
}
