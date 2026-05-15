import { Wallet, Lock, Unlock, MinusCircle } from 'lucide-react';
import Button from '../../ui/Button';
import CaixaSummary from '../components/CaixaSummary';
import CaixaTransactions from '../components/CaixaTransactions';

export default function CaixaPage({
  loading,
  caixa,
  transactions,
  resumo,
  onOpenCaixaClick,
  onCloseCaixaClick,
  onSangriaClick,
}) {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs text-text-muted">Home › Caixa</div>
          <h1 className="text-xl font-semibold mt-1">Caixa Atual</h1>
          <p className="text-sm text-text-secondary mt-0.5">
            Controle o turno aberto, registre sangrias e veja entradas/saídas em tempo real.
          </p>
        </div>
        <div className="flex gap-2">
          {!caixa && (
            <Button icon={Unlock} onClick={onOpenCaixaClick} loading={loading}>
              Abrir Caixa
            </Button>
          )}
          {caixa && (
            <>
              <Button variant="secondary" icon={MinusCircle} onClick={onSangriaClick}>
                Sangria
              </Button>
              <Button variant="danger" icon={Lock} onClick={onCloseCaixaClick}>
                Fechar Caixa
              </Button>
            </>
          )}
        </div>
      </div>

      {!loading && !caixa && (
        <div className="bg-surface border border-border rounded-lg p-12 text-center">
          <Wallet className="w-12 h-12 text-text-muted mx-auto mb-3 opacity-50" />
          <h2 className="text-lg font-semibold mb-1">Nenhum caixa aberto</h2>
          <p className="text-sm text-text-secondary mb-4">
            Abra um caixa para começar a registrar vendas, recebimentos e sangrias.
          </p>
          <Button icon={Unlock} onClick={onOpenCaixaClick}>
            Abrir Caixa
          </Button>
        </div>
      )}

      {caixa && resumo && (
        <>
          <CaixaSummary
            caixa={caixa}
            resumo={resumo}
          />
          <CaixaTransactions transactions={transactions} />
        </>
      )}
    </div>
  );
}
