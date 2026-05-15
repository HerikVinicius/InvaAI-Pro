import { useRef, useState } from 'react';
import { Upload, Package, X, ChevronRight, ArrowLeft, TrendingUp, CheckCircle, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import Button from '../ui/Button';

export default function ImportModal({ open, onClose, onImported }) {
  const fileRef = useRef(null);
  const marginInputRef = useRef(null);
  const [step, setStep] = useState('upload');
  const [file, setFile] = useState(null);
  const [parsedProducts, setParsedProducts] = useState([]);
  const [margin, setMargin] = useState('');
  const [result, setResult] = useState(null);

  const reset = () => {
    setStep('upload');
    setFile(null);
    setParsedProducts([]);
    setMargin('');
    setResult(null);
  };

  const handleClose = () => { reset(); onClose(); };

  const handleParse = async () => {
    if (!file) return;
    setStep('parsing');
    try {
      const form = new FormData();
      form.append('file', file);
      const res = await api.post('/inventory/import/parse', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setParsedProducts(res.data.products || []);
      setStep('review');
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Falha ao processar arquivo.');
      setStep('upload');
    }
  };

  const updateProduct = (idx, field, value) => {
    const updated = [...parsedProducts];
    updated[idx] = { ...updated[idx], [field]: value };
    setParsedProducts(updated);
  };

  const deleteProduct = (idx) => {
    setParsedProducts(parsedProducts.filter((_, i) => i !== idx));
  };

  const handleNextMargin = () => {
    if (parsedProducts.length === 0) {
      toast.error('Adicione pelo menos um produto antes de continuar.');
      return;
    }
    setMargin('');
    setStep('margin');
    setTimeout(() => marginInputRef.current?.focus(), 80);
  };

  const handleCommit = async () => {
    const m = parseFloat(margin) || 0;
    if (isNaN(m) || m < 0) {
      toast.error('Informe uma margem válida (≥ 0%).');
      return;
    }

    const products = parsedProducts.map((p) => ({
      ...p,
      quantity: Math.max(1, p.quantity || 1),
      name: (p.name || '').trim(),
      sku: (p.sku || '').trim().toUpperCase(),
      price: parseFloat((((p.price || p.costPrice || 0) * (1 + m / 100)).toFixed(2))),
    }));

    setStep('saving');
    try {
      const res = await api.post('/inventory/import/commit', { products });
      setResult(res.data);
      setStep('done');
      if ((res.data.summary?.errors ?? 0) === 0) {
        toast.success(`${res.data.summary.created} criados, ${res.data.summary.updated} atualizados.`);
        onImported();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Falha ao salvar produtos.');
      setStep('margin');
    }
  };

  const marginNum = parseFloat(margin) || 0;
  const totalCost = parsedProducts.reduce((s, p) => s + ((p.price || p.costPrice || 0) * (p.quantity || 1)), 0);
  const totalSale = parsedProducts.reduce((s, p) => s + ((p.price || p.costPrice || 0) * (1 + marginNum / 100) * (p.quantity || 1)), 0);
  const avgCost = parsedProducts.length ? parsedProducts.reduce((s, p) => s + (p.price || p.costPrice || 0), 0) / parsedProducts.length : 0;

  if (!open) return null;

  const stepTitles = {
    upload: 'Importar Produtos (XML, XLSX, PDF ou TXT)',
    parsing: 'Processando arquivo…',
    review: `${parsedProducts.length} produto${parsedProducts.length !== 1 ? 's' : ''} encontrado${parsedProducts.length !== 1 ? 's' : ''}`,
    margin: `${parsedProducts.length} produto${parsedProducts.length !== 1 ? 's' : ''} encontrado${parsedProducts.length !== 1 ? 's' : ''}`,
    saving: 'Salvando produtos…',
    done: 'Importação concluída',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-surface border border-border rounded-xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[88vh] animate-fade-in">

        <div className="flex items-center justify-between px-5 py-4 border-b border-border flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-md bg-accent/15 flex items-center justify-center">
              <Upload className="w-3.5 h-3.5 text-accent" />
            </div>
            <div>
              <h2 className="text-sm font-semibold leading-none">{stepTitles[step]}</h2>
              <div className="flex items-center gap-1 mt-1.5">
                {['upload', 'review', 'margin', 'done'].map((s, i) => (
                  <div key={s} className={`h-1 rounded-full transition-all duration-300 ${
                    step === 'done' || (step === 'margin' && i <= 2) || (step === 'saving' && i <= 2) || (step === 'review' && i <= 1) || (step === 'upload' && i === 0)
                      ? 'w-4 bg-accent' : 'w-2 bg-border'
                  }`} />
                ))}
              </div>
            </div>
          </div>
          <button onClick={handleClose} className="text-text-muted hover:text-text-primary transition-colors p-1 rounded hover:bg-surface-hover">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">

          {step === 'upload' && (
            <div className="p-5 space-y-4">
              <p className="text-xs text-text-secondary leading-relaxed">
                Envie um arquivo com produtos em um dos formatos: <strong>XML (NF-e), XLSX, PDF ou TXT</strong>. O sistema extrairá automaticamente
                os produtos, quantidades e valores de custo do documento.
              </p>
              <div
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200 ${
                  file ? 'border-accent/60 bg-accent/5' : 'border-border hover:border-accent/40 hover:bg-surface-hover'
                }`}
                onClick={() => fileRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const f = e.dataTransfer.files[0];
                  if (!f) return;
                  const ext = f.name.toLowerCase().split('.').pop();
                  if (['xml', 'xlsx', 'pdf', 'txt'].includes(ext)) {
                    setFile(f);
                  } else {
                    toast.error('Por favor, selecione um arquivo .xml, .xlsx, .pdf ou .txt');
                  }
                }}
              >
                {file ? (
                  <div className="space-y-2">
                    <div className="w-12 h-12 rounded-lg bg-accent/15 flex items-center justify-center mx-auto">
                      <Package className="w-6 h-6 text-accent" />
                    </div>
                    <p className="text-sm font-semibold text-accent">{file.name}</p>
                    <p className="text-xs text-text-muted">{(file.size / 1024).toFixed(1)} KB · clique para trocar</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Upload className="w-10 h-10 mx-auto text-text-muted/50" />
                    <p className="text-sm font-medium text-text-secondary">Arraste o arquivo ou clique para selecionar</p>
                    <p className="text-xs text-text-muted">XML, XLSX, PDF ou TXT · máx. 10 MB</p>
                  </div>
                )}
              </div>
              <input ref={fileRef} type="file" accept=".xml,.xlsx,.pdf,.txt" className="hidden"
                onChange={(e) => {
                  const f = e.target.files[0];
                  if (!f) return;
                  const ext = f.name.toLowerCase().split('.').pop();
                  if (['xml', 'xlsx', 'pdf', 'txt'].includes(ext)) {
                    setFile(f);
                  } else {
                    toast.error('Por favor, selecione um arquivo .xml, .xlsx, .pdf ou .txt');
                  }
                }} />
            </div>
          )}

          {step === 'parsing' && (
            <div className="flex flex-col items-center justify-center py-14 gap-5 px-5">
              <div className="relative w-16 h-16">
                <div className="absolute inset-0 rounded-full border-4 border-border" />
                <div className="absolute inset-0 rounded-full border-4 border-accent border-t-transparent animate-spin" />
                <Package className="absolute inset-0 m-auto w-6 h-6 text-accent" />
              </div>
              <div className="text-center space-y-1">
                <p className="text-sm font-semibold">Processando arquivo…</p>
                <p className="text-xs text-text-muted">Extraindo produtos, códigos e valores de custo</p>
              </div>
              <div className="w-full max-w-xs bg-surface-elevated rounded-full h-1.5 overflow-hidden relative">
                <div className="absolute inset-y-0 w-2/5 bg-accent rounded-full animate-progress-sweep" />
              </div>
            </div>
          )}

          {step === 'review' && (
            <div className="p-5 space-y-4">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-text-muted uppercase tracking-wider">Produtos encontrados</p>
                  <p className="text-xs text-text-muted">{parsedProducts.length} produto{parsedProducts.length !== 1 ? 's' : ''}</p>
                </div>
                <div className="border border-border rounded-lg overflow-hidden max-h-[400px] overflow-y-auto">
                  <table className="w-full text-xs">
                    <thead className="sticky top-0">
                      <tr className="bg-surface-elevated border-b border-border">
                        <th className="text-left px-3 py-2 text-text-muted font-medium">Código</th>
                        <th className="text-left px-3 py-2 text-text-muted font-medium">Produto</th>
                        <th className="text-center px-3 py-2 text-text-muted font-medium">Qtd</th>
                        <th className="text-right px-3 py-2 text-text-muted font-medium">Preço Unit.</th>
                        <th className="text-center px-2 py-2 w-8"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {parsedProducts.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-4 py-8 text-center text-text-muted">
                            Nenhum produto extraído
                          </td>
                        </tr>
                      ) : (
                        parsedProducts.map((p, i) => (
                          <tr key={i} className="border-b border-border last:border-0 hover:bg-surface-hover transition-colors">
                            <td className="px-3 py-2 font-mono text-text-secondary">{p.sku}</td>
                            <td className="px-3 py-2 max-w-[200px] truncate text-text-primary">{p.name}</td>
                            <td className="px-3 py-2 text-center">
                              <input
                                type="number"
                                min="1"
                                value={p.quantity || 1}
                                onChange={(e) => updateProduct(i, 'quantity', parseInt(e.target.value) || 1)}
                                className="w-12 bg-background border border-border rounded px-2 py-1 text-center text-text-primary focus:outline-none focus:border-accent"
                              />
                            </td>
                            <td className="px-3 py-2 text-right">
                              <div className="flex items-center justify-end gap-1">
                                <span className="text-text-muted">R$</span>
                                <input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  value={(p.price || p.costPrice || 0).toFixed(2)}
                                  onChange={(e) => updateProduct(i, 'price', parseFloat(e.target.value) || p.costPrice)}
                                  className="w-20 bg-background border border-border rounded px-2 py-1 text-right text-accent font-mono focus:outline-none focus:border-accent"
                                />
                              </div>
                            </td>
                            <td className="px-2 py-2 text-center">
                              <button
                                onClick={() => deleteProduct(i)}
                                className="p-1 text-text-muted hover:text-status-critical hover:bg-status-critical/10 rounded transition-colors"
                                title="Remover produto"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {parsedProducts.length > 0 && (
                <div className="grid grid-cols-3 gap-3 bg-surface-elevated border border-border rounded-lg p-4">
                  <div className="text-center">
                    <p className="text-xs text-text-muted mb-1">Total de produtos</p>
                    <p className="text-lg font-bold text-text-primary">{parsedProducts.length}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-text-muted mb-1">Qtd total</p>
                    <p className="text-lg font-bold text-text-primary">
                      {parsedProducts.reduce((s, p) => s + (p.quantity || 1), 0)}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-text-muted mb-1">Valor total</p>
                    <p className="text-lg font-bold text-accent">
                      R$ {parsedProducts.reduce((s, p) => s + ((p.price || p.costPrice || 0) * (p.quantity || 1)), 0).toFixed(2)}
                    </p>
                  </div>
                </div>
              )}

              <p className="text-xs text-text-muted text-center leading-relaxed">
                Edite quantidade e preço conforme necessário. Clique o X para remover produtos.
              </p>
            </div>
          )}

          {step === 'margin' && (
            <div className="p-5 space-y-5">
              <div className="space-y-1.5">
                <p className="text-xs font-medium text-text-muted uppercase tracking-wider">Produtos a importar</p>
                <div className="border border-border rounded-lg overflow-hidden max-h-48 overflow-y-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-surface-elevated border-b border-border">
                        <th className="text-left px-3 py-2 text-text-muted font-medium">Produto</th>
                        <th className="text-left px-3 py-2 text-text-muted font-medium">SKU</th>
                        <th className="text-right px-3 py-2 text-text-muted font-medium">Qtd</th>
                        <th className="text-right px-3 py-2 text-text-muted font-medium">Custo</th>
                      </tr>
                    </thead>
                    <tbody>
                      {parsedProducts.map((p, i) => (
                        <tr key={i} className="border-b border-border last:border-0 hover:bg-surface-hover">
                          <td className="px-3 py-2 max-w-[160px] truncate font-medium">{p.name}</td>
                          <td className="px-3 py-2 font-mono text-text-muted">{p.sku}</td>
                          <td className="px-3 py-2 text-right font-mono">{p.quantity}</td>
                          <td className="px-3 py-2 text-right font-mono text-text-secondary">
                            R$ {(p.price || p.costPrice || 0).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="bg-surface-elevated border border-border rounded-xl p-5 space-y-4">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-accent" />
                  <p className="text-sm font-semibold">Margem de Lucro</p>
                  <span className="text-xs text-text-muted ml-auto">aplicada sobre o custo unitário</span>
                </div>

                <div className="relative">
                  <input
                    ref={marginInputRef}
                    type="number"
                    min="0"
                    step="0.1"
                    value={margin}
                    onChange={(e) => setMargin(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleCommit()}
                    placeholder="Ex: 30"
                    className="w-full bg-background border border-border rounded-lg pl-4 pr-12 py-4 text-3xl font-mono font-bold text-text-primary placeholder:text-text-muted/30 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/30 transition-all text-center"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xl font-bold text-text-muted pointer-events-none">%</span>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-background border border-border rounded-lg p-3 text-center">
                    <p className="text-xs text-text-muted mb-1">Custo médio</p>
                    <p className="text-sm font-mono font-bold text-text-secondary">R$ {avgCost.toFixed(2)}</p>
                  </div>
                  <div className="bg-background border border-border rounded-lg p-3 text-center">
                    <p className="text-xs text-text-muted mb-1">Preço de venda</p>
                    <p className="text-sm font-mono font-bold text-accent">
                      R$ {(avgCost * (1 + marginNum / 100)).toFixed(2)}
                    </p>
                  </div>
                  <div className="bg-background border border-border rounded-lg p-3 text-center">
                    <p className="text-xs text-text-muted mb-1">Lucro estimado</p>
                    <p className="text-sm font-mono font-bold text-emerald-400">
                      R$ {(totalSale - totalCost).toFixed(2)}
                    </p>
                  </div>
                </div>

                <p className="text-xs text-text-muted text-center">
                  O <strong>preço de custo não será salvo</strong> — apenas o preço de venda calculado ficará visível no estoque.
                </p>
              </div>
            </div>
          )}

          {step === 'saving' && (
            <div className="flex flex-col items-center justify-center py-14 gap-5 px-5">
              <div className="relative w-16 h-16">
                <div className="absolute inset-0 rounded-full border-4 border-border" />
                <div className="absolute inset-0 rounded-full border-4 border-accent border-t-transparent animate-spin" />
                <CheckCircle className="absolute inset-0 m-auto w-6 h-6 text-accent" />
              </div>
              <div className="text-center space-y-1">
                <p className="text-sm font-semibold">Salvando produtos…</p>
                <p className="text-xs text-text-muted">Aplicando margem e gravando no estoque</p>
              </div>
              <div className="w-full max-w-xs bg-surface-elevated rounded-full h-1.5 overflow-hidden relative">
                <div className="absolute inset-y-0 w-2/5 bg-accent rounded-full animate-progress-sweep" />
              </div>
            </div>
          )}

          {step === 'done' && result && (
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="bg-accent/8 border border-accent/25 rounded-lg p-3">
                  <div className="text-2xl font-bold text-accent">{result.summary?.created ?? 0}</div>
                  <div className="text-xs text-text-muted mt-0.5">Criados</div>
                </div>
                <div className="bg-background border border-border rounded-lg p-3">
                  <div className="text-2xl font-bold text-text-secondary">{result.summary?.updated ?? 0}</div>
                  <div className="text-xs text-text-muted mt-0.5">Atualizados</div>
                </div>
                <div className={`rounded-lg p-3 border ${(result.summary?.errors ?? 0) > 0 ? 'bg-status-critical/10 border-status-critical/30' : 'bg-background border-border'}`}>
                  <div className={`text-2xl font-bold ${(result.summary?.errors ?? 0) > 0 ? 'text-status-critical' : 'text-text-muted'}`}>
                    {result.summary?.errors ?? 0}
                  </div>
                  <div className="text-xs text-text-muted mt-0.5">Erros</div>
                </div>
              </div>
              <div className="space-y-1 max-h-56 overflow-y-auto">
                {(result.log || []).map((item, i) => (
                  <div key={i} className={`flex items-center gap-2 text-xs px-3 py-2 rounded-lg ${item.success ? 'bg-accent/5' : 'bg-status-critical/10'}`}>
                    {item.success
                      ? <CheckCircle className="w-3.5 h-3.5 text-accent flex-shrink-0" />
                      : <AlertCircle className="w-3.5 h-3.5 text-status-critical flex-shrink-0" />
                    }
                    <span className="font-mono text-text-muted w-28 truncate">{item.sku}</span>
                    <span className="truncate text-text-secondary flex-1">{item.name}</span>
                    <span className={`flex-shrink-0 ${item.success ? 'text-text-muted' : 'text-status-critical'}`}>
                      {item.success ? (item.action === 'created' ? 'Criado' : 'Atualizado') : item.error}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-2 px-5 py-4 border-t border-border flex-shrink-0">
          {step === 'upload' && (
            <>
              <Button variant="secondary" onClick={handleClose}>Cancelar</Button>
              <Button icon={ChevronRight} className="ml-auto" disabled={!file} onClick={handleParse}>
                Processar XML
              </Button>
            </>
          )}
          {step === 'review' && (
            <>
              <Button variant="secondary" icon={ArrowLeft} onClick={() => setStep('upload')}>Voltar</Button>
              <Button icon={ChevronRight} className="ml-auto" disabled={parsedProducts.length === 0} onClick={handleNextMargin}>
                Próximo: Margem
              </Button>
            </>
          )}
          {step === 'margin' && (
            <>
              <Button variant="secondary" icon={ArrowLeft} onClick={() => setStep('review')}>Voltar</Button>
              <Button icon={ChevronRight} className="ml-auto" disabled={margin === ''} onClick={handleCommit}>
                Importar com {marginNum > 0 ? `${marginNum}% de margem` : 'margem 0%'}
              </Button>
            </>
          )}
          {step === 'done' && (
            <>
              <Button variant="secondary" onClick={reset}>Importar outro</Button>
              <Button className="ml-auto" onClick={handleClose}>Concluir</Button>
            </>
          )}
          {(step === 'parsing' || step === 'saving') && (
            <Button variant="secondary" disabled className="ml-auto">Aguarde…</Button>
          )}
        </div>
      </div>
    </div>
  );
}
