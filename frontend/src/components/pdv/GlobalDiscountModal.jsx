import { useEffect, useRef, useState } from 'react';
import { Tag, X, Check } from 'lucide-react';
import TypeToggle from '../ui/TypeToggle';

/**
 * F9 Global Discount Modal
 *
 * Props:
 *   open        – boolean
 *   onClose     – () => void
 *   subtotal    – number (sum of item totals before global discount)
 *   initialDiscount     – number
 *   initialDiscountType – 'percentage' | 'fixed'
 *   onApply     – (discount: number, discountType: string) => void
 */
export default function GlobalDiscountModal({
  open,
  onClose,
  subtotal,
  initialDiscount = 0,
  initialDiscountType = 'percentage',
  onApply,
}) {
  const [value, setValue] = useState('');
  const [type, setType] = useState('percentage');
  const inputRef = useRef(null);

  useEffect(() => {
    if (open) {
      setValue(initialDiscount > 0 ? String(initialDiscount) : '');
      setType(initialDiscountType);
      // Small timeout so the modal animation completes before focus
      setTimeout(() => inputRef.current?.focus(), 60);
    }
  }, [open, initialDiscount, initialDiscountType]);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'Enter') handleApply();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, value, type]);

  const numVal = parseFloat(value) || 0;
  const discountAmount = type === 'fixed'
    ? Math.min(numVal, subtotal)
    : subtotal * (Math.min(numVal, 100) / 100);
  const finalTotal = Math.max(0, subtotal - discountAmount);

  const handleApply = () => {
    onApply(numVal, type);
    onClose();
  };

  const handleClear = () => {
    onApply(0, type);
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="relative w-full max-w-sm bg-surface border border-border rounded-xl shadow-2xl overflow-hidden animate-slide-up">

        {/* Header stripe */}
        <div className="px-5 py-4 flex items-center justify-between border-b border-border bg-surface-elevated">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-md bg-accent/15 flex items-center justify-center">
              <Tag className="w-3.5 h-3.5 text-accent" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-text-primary leading-none">Desconto Global</h2>
              <p className="text-xs text-text-muted mt-0.5">Aplicado sobre o subtotal — tecla F9</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-text-muted hover:text-text-primary transition-colors p-1 rounded hover:bg-surface-hover"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Type toggle */}
          <div>
            <label className="label-caps mb-2 block">Tipo de Desconto</label>
            <TypeToggle
              value={type}
              onChange={setType}
              options={[
                { value: 'percentage', label: '% Percentual' },
                { value: 'fixed', label: 'R$ Valor Fixo' },
              ]}
            />
          </div>

          {/* Value input */}
          <div>
            <label className="label-caps mb-2 block">
              {type === 'percentage' ? 'Percentual (0–100)' : 'Valor (R$)'}
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted text-sm font-mono pointer-events-none">
                {type === 'percentage' ? '%' : 'R$'}
              </span>
              <input
                ref={inputRef}
                type="number"
                min="0"
                max={type === 'percentage' ? 100 : undefined}
                step="0.01"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder="0"
                className="w-full bg-background border border-border rounded-lg pl-9 pr-3 py-3 text-xl font-mono font-bold text-text-primary placeholder:text-text-muted/40 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/30 transition-all"
              />
            </div>
          </div>

          {/* Live preview */}
          <div className={`rounded-lg border px-4 py-3 transition-colors ${
            discountAmount > 0
              ? 'bg-accent/8 border-accent/25'
              : 'bg-surface-elevated border-border'
          }`}>
            <p className="text-xs text-text-muted mb-2 font-medium uppercase tracking-wider">Resumo do Desconto</p>
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-text-secondary">Subtotal original</span>
                <span className="font-mono text-text-primary">R$ {subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-text-secondary">Desconto</span>
                <span className={`font-mono font-semibold ${discountAmount > 0 ? 'text-status-critical' : 'text-text-muted'}`}>
                  {discountAmount > 0 ? `- R$ ${discountAmount.toFixed(2)}` : '—'}
                </span>
              </div>
              <div className="border-t border-border/60 pt-1.5 flex justify-between">
                <span className="text-sm font-semibold text-text-primary">Total a Pagar</span>
                <span className={`text-sm font-mono font-bold ${discountAmount > 0 ? 'text-accent' : 'text-text-primary'}`}>
                  R$ {finalTotal.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="px-5 pb-5 flex gap-2">
          <button
            type="button"
            onClick={handleClear}
            className="flex-1 py-2.5 rounded-lg border border-border text-sm text-text-secondary hover:text-text-primary hover:bg-surface-hover transition-colors font-medium"
          >
            Remover Desconto
          </button>
          <button
            type="button"
            onClick={handleApply}
            className="flex-1 py-2.5 rounded-lg bg-accent text-background text-sm font-semibold hover:bg-accent-hover transition-colors flex items-center justify-center gap-2"
          >
            <Check className="w-4 h-4" />
            Aplicar
          </button>
        </div>

        {/* Keyboard hint */}
        <div className="px-5 pb-4 flex items-center justify-center gap-3">
          <span className="text-xs text-text-muted flex items-center gap-1">
            <kbd className="bg-surface-elevated border border-border px-1.5 py-0.5 rounded text-[10px] font-mono">Enter</kbd>
            confirmar
          </span>
          <span className="text-xs text-text-muted flex items-center gap-1">
            <kbd className="bg-surface-elevated border border-border px-1.5 py-0.5 rounded text-[10px] font-mono">Esc</kbd>
            fechar
          </span>
        </div>
      </div>
    </div>
  );
}
