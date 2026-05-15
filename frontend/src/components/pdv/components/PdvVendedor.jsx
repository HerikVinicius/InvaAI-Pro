import { Users, ChevronRight } from 'lucide-react';
import Button from '../../ui/Button';

export default function PdvVendedor({
  vendedores = [],
  vendedorSelecionado = '',
  onVendedorChange = () => {},
  onClearAll = () => {},
  onNavigateToPayment = () => {},
}) {
  return (
    <div className="bg-surface border border-border rounded-lg p-5">
      <div className="flex items-center gap-2 mb-4">
        <Users className="w-4 h-4 text-accent" />
        <h3 className="text-sm font-semibold">Vendedor Responsável</h3>
      </div>
      <select
        value={vendedorSelecionado}
        onChange={(e) => onVendedorChange(e.target.value)}
        className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent"
      >
        <option value="">Selecione o vendedor...</option>
        {vendedores.map(v => (
          <option key={v._id} value={v._id}>{v.name}</option>
        ))}
      </select>
      {vendedores.length === 0 && (
        <p className="text-xs text-text-muted mt-2">
          Nenhum vendedor cadastrado. <a href="/vendedores" className="text-accent hover:underline">Cadastrar agora</a>
        </p>
      )}
      <div className="flex justify-between items-center mt-4 pt-4 border-t border-border">
        <Button variant="secondary" onClick={onClearAll}>
          Limpar Tudo
        </Button>
        <Button icon={ChevronRight} onClick={onNavigateToPayment}>
          Avançar para Pagamento
        </Button>
      </div>
    </div>
  );
}
