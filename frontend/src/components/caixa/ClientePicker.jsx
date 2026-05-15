import { useEffect, useState } from 'react';
import { Search, UserPlus, Phone, AlertCircle, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import { clientesService } from '../../services/clientesService';
import Button from '../ui/Button';

const fmt = (n) => `R$ ${(n || 0).toFixed(2)}`;

/**
 * Inline cliente picker: search existing or quick-create.
 * Calls `onSelect(cliente)` when one is chosen.
 * Designed to embed inside another card/modal — has no border of its own.
 */
export default function ClientePicker({ selected, onSelect, onClear }) {
  const [search, setSearch] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');

  useEffect(() => {
    if (selected) return;
    const handler = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await clientesService.list({ search: search || undefined, limit: 8 });
        setResults(res.data.clientes || []);
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    }, 200);
    return () => clearTimeout(handler);
  }, [search, selected]);

  const handleCreate = async () => {
    if (!newName.trim()) {
      toast.error('Informe o nome do cliente.');
      return;
    }
    setCreating(true);
    try {
      const res = await clientesService.create({ name: newName.trim(), phone: newPhone.trim() });
      const cliente = res.data.cliente;
      toast.success('Cliente cadastrado.');
      onSelect(cliente);
      setNewName('');
      setNewPhone('');
    } catch (err) {
      toast.error(err.message || 'Falha ao criar cliente.');
    } finally {
      setCreating(false);
    }
  };

  if (selected) {
    return (
      <div className="bg-amber-500/5 border border-amber-500/30 rounded-md p-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-full bg-amber-500/15 text-amber-300 flex items-center justify-center font-semibold text-xs flex-shrink-0">
              {selected.name?.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()}
            </div>
            <div className="min-w-0">
              <div className="text-sm font-semibold flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-accent" />
                {selected.name}
              </div>
              <div className="text-xs text-text-muted flex items-center gap-2">
                {selected.phone && <><Phone className="w-3 h-3" />{selected.phone}</>}
                {selected.saldoDevedor > 0 && (
                  <span className="text-status-critical font-medium">
                    Saldo já devedor: {fmt(selected.saldoDevedor)}
                  </span>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={onClear}
            className="text-xs text-text-muted hover:text-status-critical transition-colors flex-shrink-0"
          >
            Trocar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
        <input
          autoFocus
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar cliente por nome ou telefone..."
          className="w-full bg-background border border-border rounded-md pl-9 pr-3 py-2 text-sm focus:outline-none focus:border-accent"
        />
      </div>

      {/* Results */}
      {results.length > 0 && (
        <div className="bg-surface-elevated border border-border rounded-md divide-y divide-border max-h-48 overflow-y-auto">
          {results.map((c) => (
            <button
              key={c._id}
              type="button"
              onClick={() => onSelect(c)}
              className="w-full text-left px-3 py-2 hover:bg-surface-hover transition-colors flex items-center gap-3"
            >
              <div className="w-7 h-7 rounded-full bg-accent/15 text-accent flex items-center justify-center text-[10px] font-semibold flex-shrink-0">
                {c.name?.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">{c.name}</div>
                <div className="text-xs text-text-muted flex items-center gap-2">
                  {c.phone || '—'}
                  {c.saldoDevedor > 0 && (
                    <span className="text-status-critical">deve {fmt(c.saldoDevedor)}</span>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {!loading && results.length === 0 && search && (
        <div className="text-xs text-text-muted flex items-center gap-2 px-1">
          <AlertCircle className="w-3.5 h-3.5" />
          Nenhum cliente encontrado para "{search}".
        </div>
      )}

      {/* Quick create */}
      <details className="bg-surface-elevated border border-border rounded-md">
        <summary className="px-3 py-2 cursor-pointer text-xs flex items-center gap-2 hover:bg-surface-hover">
          <UserPlus className="w-3.5 h-3.5 text-accent" />
          <span className="font-medium">Cadastrar novo cliente</span>
        </summary>
        <div className="p-3 border-t border-border space-y-2">
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Nome completo *"
            className="w-full bg-background border border-border rounded px-2 py-1.5 text-sm focus:outline-none focus:border-accent"
          />
          <input
            value={newPhone}
            onChange={(e) => setNewPhone(e.target.value)}
            placeholder="Telefone (opcional)"
            className="w-full bg-background border border-border rounded px-2 py-1.5 text-sm focus:outline-none focus:border-accent"
          />
          <Button
            size="sm"
            onClick={handleCreate}
            loading={creating}
            disabled={!newName.trim()}
            className="w-full"
          >
            Cadastrar e Selecionar
          </Button>
        </div>
      </details>
    </div>
  );
}
