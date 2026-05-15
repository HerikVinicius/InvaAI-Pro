import { Barcode } from 'lucide-react';

export default function PdvSearch({
  query = '',
  quantidade = 1,
  setQuantidade = () => {},
  buscando = false,
  sugestoes = [],
  sugestoesVisiveis = false,
  inputRef = null,
  dropdownRef = null,
  handleQueryChange = () => {},
  handleKeyDown = () => {},
  onAddProduct = () => {},
}) {
  return (
    <div className="bg-surface border border-border rounded-lg p-5">
      <div className="flex items-center gap-2 mb-4">
        <Barcode className="w-4 h-4 text-accent" />
        <h3 className="text-sm font-semibold">Buscar Produto</h3>
      </div>
      <div className="flex gap-3 items-end">
        <div className="flex-1 relative">
          <label className="label-caps mb-1 block">Nome ou Código (SKU)</label>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={handleQueryChange}
            onKeyDown={handleKeyDown}
            onFocus={() => {
              if (query.trim() && sugestoes.length > 0) {
                // Show dropdown
              }
            }}
            placeholder="Digite o nome ou escaneie o código do produto..."
            className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent"
            autoFocus
            autoComplete="off"
          />
          {/* Dropdown */}
          {sugestoesVisiveis && sugestoes.length > 0 && (
            <div
              ref={dropdownRef}
              className="absolute top-full left-0 right-0 mt-1 bg-surface border border-border rounded-md shadow-xl z-30 overflow-hidden"
            >
              {sugestoes.map((p) => (
                <button
                  key={p._id}
                  className="w-full text-left px-3 py-2.5 hover:bg-surface-hover transition-colors flex items-center justify-between gap-3 border-b border-border last:border-0"
                  onMouseDown={() => onAddProduct(p)}
                >
                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate">{p.name}</div>
                    <div className="text-xs text-text-muted font-mono">{p.sku}</div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-sm font-semibold text-accent">R$ {p.price?.toFixed(2)}</div>
                    <div className={`text-xs ${p.quantity <= 0 ? 'text-status-critical' : 'text-text-muted'}`}>
                      {p.quantity <= 0 ? 'Sem estoque' : `${p.quantity} un.`}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
          {buscando && (
            <div className="absolute right-3 top-8 text-text-muted">
              <div className="w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </div>
        <div className="w-28">
          <label className="label-caps mb-1 block">Quantidade</label>
          <input
            type="number"
            min={1}
            value={quantidade}
            onChange={(e) => setQuantidade(Math.max(1, parseInt(e.target.value) || 1))}
            className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent text-center font-mono"
          />
        </div>
      </div>
      <p className="text-xs text-text-muted mt-2">
        Pressione <kbd className="bg-surface-elevated border border-border px-1 rounded text-[10px]">Enter</kbd> para adicionar quando houver apenas um resultado
      </p>
    </div>
  );
}
