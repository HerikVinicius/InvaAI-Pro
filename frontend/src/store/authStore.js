import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authService } from '../services/authService';
import api from '../services/api';

// Espelha permissionHelper.js do backend.
// null no campo do usuário = usa padrão da role.
const ROLE_DEFAULTS = {
  permitir_abrir_caixa:      { master: true, admin: true, lojista: true, gerente: true, vendedor: false },
  permitir_cadastrar_produto: { master: true, admin: true, lojista: true, gerente: true, vendedor: false },
};

export function can(user, permission) {
  if (!user) return false;
  const override = user[permission];
  if (override !== null && override !== undefined) return override === true;
  return ROLE_DEFAULTS[permission]?.[user.role] === true;
}

export const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      loading: false,

      login: async (credentials) => {
        set({ loading: true });
        try {
          const response = await authService.login(credentials);
          const data = response.data || response;
          localStorage.setItem('invaai_token', data.token);
          localStorage.setItem('invaai_user', JSON.stringify(data.user));
          set({
            user: data.user,
            token: data.token,
            isAuthenticated: true,
            loading: false,
          });
          return { success: true };
        } catch (err) {
          set({ loading: false });
          return { success: false, message: err.message || 'Login failed' };
        }
      },

      register: async (payload) => {
        set({ loading: true });
        try {
          const response = await authService.register(payload);
          const data = response.data || response;
          localStorage.setItem('invaai_token', data.token);
          localStorage.setItem('invaai_user', JSON.stringify(data.user));
          set({
            user: data.user,
            token: data.token,
            isAuthenticated: true,
            loading: false,
          });
          return { success: true };
        } catch (err) {
          set({ loading: false });
          return { success: false, message: err.message || 'Registration failed' };
        }
      },

      logout: () => {
        localStorage.removeItem('invaai_token');
        localStorage.removeItem('invaai_user');
        set({ user: null, token: null, isAuthenticated: false });
      },

      // Sincroniza o usuário com o banco — necessário para refletir overrides
      // de permissão alterados por um admin sem forçar novo login.
      syncUser: async () => {
        try {
          const res = await api.get('/auth/me');
          const fresh = res.data.user;
          localStorage.setItem('invaai_user', JSON.stringify(fresh));
          set((state) => ({ user: { ...state.user, ...fresh } }));
        } catch {
          // Silencioso — se falhar, o usuário continua com os dados do cache.
        }
      },
    }),
    {
      name: 'invaai-auth',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
