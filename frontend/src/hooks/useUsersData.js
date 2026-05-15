import { useEffect, useState, useCallback, useMemo } from 'react';
import toast from 'react-hot-toast';
import api from '../services/api';
import { useAuthStore } from '../store/authStore';
import { calculateUsersSummary } from '../utils/business-logic';

export function useUsersData(options = {}) {
  const { user } = useAuthStore();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filtroTenant, setFiltroTenant] = useState('todos');
  const [filtroRole, setFiltroRole] = useState('todos');

  const isMaster = user?.role === 'master';
  const isAdmin = user?.role === 'admin';
  const isLojista = user?.role === 'lojista';
  const canAccess = isMaster || isAdmin || isLojista;

  const loadUsers = useCallback(async () => {
    if (!canAccess) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await api.get('/users');
      setUsers(res.data.users || []);
    } catch (err) {
      toast.error(err.message || 'Falha ao carregar usuários.');
    } finally {
      setLoading(false);
    }
  }, [canAccess]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const toggleChat = useCallback(async (userId, currentState) => {
    try {
      await api.put(`/users/${userId}/ai-chat`, { aiChatEnabled: !currentState });
      toast.success(`Chat ${!currentState ? 'ativado' : 'desativado'}.`);
      setUsers(prev => prev.map(u => u._id === userId ? { ...u, aiChatEnabled: !currentState } : u));
    } catch {
      toast.error('Falha ao atualizar permissão.');
    }
  }, []);

  const changeRole = useCallback(async (userId, newRole) => {
    try {
      await api.put(`/users/${userId}/role`, { role: newRole });
      toast.success('Função atualizada.');
      setUsers(prev => prev.map(u => u._id === userId ? { ...u, role: newRole } : u));
    } catch (err) {
      toast.error(err.message || 'Falha ao atualizar função.');
    }
  }, []);

  const toggleActive = useCallback(async (userId, currentActive) => {
    try {
      await api.put(`/users/${userId}/active`, { isActive: !currentActive });
      toast.success(`Usuário ${!currentActive ? 'ativado' : 'desativado'}.`);
      setUsers(prev => prev.map(u => u._id === userId ? { ...u, isActive: !currentActive } : u));
    } catch {
      toast.error('Falha ao atualizar status.');
    }
  }, []);

  const searchRx = useMemo(() => {
    const trimmed = search.trim();
    if (!trimmed) return null;
    const escaped = trimmed.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp(escaped, 'i');
  }, [search]);

  const usersFiltrados = useMemo(() => {
    return users.filter(u => {
      if (filtroTenant !== 'todos' && u.tenantId !== filtroTenant) return false;
      if (filtroRole !== 'todos' && u.role !== filtroRole) return false;
      if (searchRx && !(searchRx.test(u.name || '') || searchRx.test(u.username || ''))) return false;
      return true;
    });
  }, [users, filtroTenant, filtroRole, searchRx]);

  const tenants = useMemo(() => {
    return ['todos', ...new Set(users.map(u => u.tenantId).filter(Boolean))];
  }, [users]);

  const summary = useMemo(() => {
    return calculateUsersSummary(users);
  }, [users]);

  return {
    users,
    usersFiltrados,
    loading,
    search,
    setSearch,
    filtroTenant,
    setFiltroTenant,
    filtroRole,
    setFiltroRole,
    tenants,
    summary,
    isMaster,
    isAdmin,
    isLojista,
    canAccess,
    reload: loadUsers,
    toggleChat,
    changeRole,
    toggleActive,
  };
}
