import { Barcode, Trash2, ShoppingCart, Tag } from 'lucide-react';

function applyItemDiscount(unitPrice, quantity, discount, discountType) {
  const gross = unitPrice * quantity;
  if (!discount || discount <= 0) return gross;
  const d = discountType === 'fixed'
    ? Math.min(discount, gross)
    : gross * (Math.min(discount, 100) / 100);
  return Math.max(0, gross - d);
}

export default function PdvCart({
  itens = [],
  globalDiscount = 0,
  globalDiscountType = 'percentage',
  subtotal = 0,
  totalGeral = 0,
  onRemoveItem = () => {},
  onUpdateItem = () => {},
  onOpenDiscount = () => {},
}) {
  const globalDiscountAmount = globalDiscountType === 'fixed'
    ? Math.min(globalDiscount, subtotal)
    : subtotal * (Math.min(globalDiscount, 100) / 100);

  return (
    <div className="bg-surface border border-border rounded-lg overflow-hidden">
      <div className="px-4 py-3 border-b border-border flex items-center gap-2">
        <ShoppingCart className="w-4 h-4 text-accent" />
        <h3 className="text-sm font-semibold">Itens da Venda</h3>
        {itens.length > 0 && (
          <span className="ml-auto text-xs bg-accent/15 text-accent px-2 py-0.5 rounded-full font-medium">
            {itens.length} {itens.length === 1 ? 'item' : 'itens'}
          </span>
        )}
      </div>

      <table className="w-full">
        <thead>
          <tr className="bg-surface-elevated border-b border-border">
            <th className="text-left px-4 py-3 label-caps">Produto</th>
            <th className="text-left px-4 py-3 label-caps">Código</th>
            <th className="text-center px-4 py-3 label-caps">Qtd</th>
            <th className="text-right px-4 py-3 label-caps">Unit.</th>
            <th className="text-center px-4 py-3 label-caps">Desconto</th>
            <th className="text-right px-4 py-3 label-caps">Total</th>
            <th className="px-2 py-3" />
          </tr>
        </thead>
        <tbody>
          {itens.length === 0 ? (
            <tr>
              <td colSpan={7} className="text-center py-12 text-text-secondary text-sm">
                <Barcode className="w-8 h-8 mx-auto mb-2 opacity-30" />
                Nenhum produto adicionado. Busque acima pelo nome ou código.
              </td>
            </tr>
          ) : (
            itens.map((item) => {
              const itemTotal = applyItemDiscount(item.precoUnitario, item.quantidade, item.discount, item.discountType);
              return (
                <tr key={item.sku} className="border-b border-border hover:bg-surface-hover transition-colors">
                  <td className="px-4 py-3 text-sm font-medium">{item.nome}</td>
                  <td className="px-4 py-3">
                    <span className="data-mono text-xs text-text-secondary">{item.sku}</span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <input
                      type="number"
                      min={1}
                      value={item.quantidade}
                      onChange={(e) => onUpdateItem(item.sku, 'quantidade', Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-16 bg-background border border-border rounded px-2 py-1 text-xs text-center font-mono focus:outline-none focus:border-accent"
                    />
                  </td>
                  <td className="px-4 py-3 text-right data-mono text-sm">
                    R$ {item.precoUnitario.toFixed(2)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 justify-center">
                      <input
                        type="number"
                        min={0}
                        max={item.discountType === 'percentage' ? 100 : undefined}
                        step="0.01"
                        value={item.discount || ''}
                        onChange={(e) => onUpdateItem(item.sku, 'discount', parseFloat(e.target.value) || 0)}
                        placeholder="0"
                        className="w-16 bg-background border border-border rounded px-2 py-1 text-xs text-center font-mono focus:outline-none focus:border-accent"
                      />
                      <select
                        value={item.discountType}
                        onChange={(e) => onUpdateItem(item.sku, 'discountType', e.target.value)}
                        className="bg-background border border-border rounded px-1 py-1 text-xs text-text-secondary focus:outline-none focus:border-accent"
                      >
                        <option value="percentage">%</option>
                        <option value="fixed">R$</option>
                      </select>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right data-mono text-sm font-semibold text-accent">
                    R$ {itemTotal.toFixed(2)}
                  </td>
                  <td className="px-2 py-3 text-right">
                    <button
                      onClick={() => onRemoveItem(item.sku)}
                      className="text-text-muted hover:text-status-critical transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
        {itens.length > 0 && (
          <tfoot>
            <tr className="border-t border-border bg-surface-elevated">
              <td colSpan={4} className="px-4 py-2 text-xs text-text-secondary text-right">
                Subtotal:
              </td>
              <td className="px-4 py-2 text-right" />
              <td className="px-4 py-2 text-right data-mono text-sm text-text-secondary">
                R$ {subtotal.toFixed(2)}
              </td>
              <td />
            </tr>
            {globalDiscount > 0 && (
              <tr className="border-t border-border bg-surface-elevated">
                <td colSpan={4} className="px-4 py-2 text-xs text-right">
                  <button
                    type="button"
                    onClick={onOpenDiscount}
                    className="inline-flex items-center gap-1 text-accent hover:underline"
                  >
                    <Tag className="w-3 h-3" />
                    Desconto global ({globalDiscountType === 'percentage' ? `${globalDiscount}%` : `R$ ${globalDiscount.toFixed(2)}`}):
                  </button>
                </td>
                <td className="px-4 py-2 text-right" />
                <td className="px-4 py-2 text-right data-mono text-sm text-status-critical font-medium">
                  − R$ {globalDiscountAmount.toFixed(2)}
                </td>
                <td />
              </tr>
            )}
            <tr className="bg-surface-elevated border-t border-border">
              <td colSpan={4} className="px-4 py-3 text-sm font-semibold text-right">
                <div className="flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={onOpenDiscount}
                    className="text-xs text-text-muted hover:text-accent transition-colors flex items-center gap-1 border border-border hover:border-accent/40 px-2 py-1 rounded"
                  >
                    <Tag className="w-3 h-3" />
                    Desconto global
                    <kbd className="ml-1 text-[10px] font-mono bg-background border border-border px-1 rounded">F9</kbd>
                  </button>
                  Total a Pagar:
                </div>
              </td>
              <td className="px-4 py-3 text-right" />
              <td className="px-4 py-3 text-right data-mono text-lg font-bold text-accent">
                R$ {totalGeral.toFixed(2)}
              </td>
              <td />
            </tr>
          </tfoot>
        )}
      </table>
    </div>
  );
}
