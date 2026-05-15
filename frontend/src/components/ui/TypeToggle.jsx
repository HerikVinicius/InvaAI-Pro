/**
 * Componente de toggle para selecionar entre tipos (ex: % ou R$)
 * Reutilizável em desconto, preço, etc
 *
 * @param {string} value - valor selecionado
 * @param {Function} onChange - callback quando selecionar novo tipo
 * @param {Array} options - [{ value: 'percentage', label: '%' }, ...]
 * @param {string} className - classes Tailwind adicionais
 *
 * @example
 * <TypeToggle
 *   value={discountType}
 *   onChange={setDiscountType}
 *   options={[
 *     { value: 'percentage', label: '%' },
 *     { value: 'fixed', label: 'R$' },
 *   ]}
 * />
 */
export default function TypeToggle({ value, onChange, options = [], className = '' }) {
  if (options.length === 0) {
    console.warn('[TypeToggle] options array is empty');
    return null;
  }

  return (
    <div className={`flex rounded-md overflow-hidden border border-border h-[38px] ${className}`}>
      {options.map((opt, idx) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={`flex-1 text-xs font-semibold px-3 transition-colors ${
            idx > 0 ? 'border-l border-border' : ''
          } ${
            value === opt.value
              ? 'bg-accent text-background'
              : 'bg-background text-text-muted hover:text-text-primary'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
