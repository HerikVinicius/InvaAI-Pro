import { useEffect, useState } from 'react';
import { Tag } from 'lucide-react';
import { inventoryService } from '../../services/inventoryService';
import { useFormSubmit } from '../../hooks/useFormSubmit';
import { validatePrice, validateQuantity, validateDiscount } from '../../constants/validation';
import TypeToggle from '../ui/TypeToggle';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Modal from '../ui/Modal';

export default function ProductFormModal({ open, onClose, product, onSaved }) {
  const isEdit = !!product;
  const [form, setForm] = useState({
    name: '', sku: '', category: '', quantity: 0, price: 0, warehouseLocation: '', description: '',
  });
  const [percentualLimite, setPercentualLimite] = useState(20);
  const [defaultDiscount, setDefaultDiscount] = useState('');
  const [defaultDiscountType, setDefaultDiscountType] = useState('percentage');

  useEffect(() => {
    if (product) {
      setForm({
        name: product.name || '', sku: product.sku || '', category: product.category || '',
        quantity: product.quantity ?? 0, price: product.price ?? 0,
        warehouseLocation: product.warehouseLocation || '', description: product.description || '',
      });
      setPercentualLimite(product.lowStockPercent ?? 20);
      setDefaultDiscount(product.defaultDiscount != null ? String(product.defaultDiscount) : '');
      setDefaultDiscountType(product.defaultDiscountType || 'percentage');
    } else {
      setForm({ name: '', sku: '', category: '', quantity: 0, price: 0, warehouseLocation: '', description: '' });
      setPercentualLimite(20);
      setDefaultDiscount('');
      setDefaultDiscountType('percentage');
    }
  }, [product, open]);

  const { submitting, handleSubmit } = useFormSubmit(
    async () => {
      if (!form.name || !form.sku || !form.category || !form.quantity || !form.price) {
        throw new Error('Por favor, preencha todos os campos obrigatórios.');
      }

      const quantityError = validateQuantity(form.quantity);
      if (quantityError) throw new Error(quantityError);

      const priceError = validatePrice(form.price);
      if (priceError) throw new Error(priceError);

      const discountVal = parseFloat(defaultDiscount) || 0;
      const discountError = validateDiscount(discountVal, defaultDiscountType);
      if (discountError) throw new Error(discountError);

      const submitData = {
        ...form,
        lowStockPercent: percentualLimite,
        defaultDiscount: discountVal,
        defaultDiscountType,
      };

      if (isEdit) {
        await inventoryService.update(product._id, submitData);
      } else {
        await inventoryService.create(submitData);
      }
    },
    {
      successMessage: isEdit ? 'Produto atualizado.' : 'Produto criado.',
      onSuccess: onSaved
    }
  );

  const lowStockThreshold = Math.round(form.quantity * (percentualLimite / 100));

  // Live preview of what the default discount means for the current price
  const discountVal = parseFloat(defaultDiscount) || 0;
  const discountedPrice = defaultDiscountType === 'fixed'
    ? Math.max(0, form.price - discountVal)
    : Math.max(0, form.price * (1 - discountVal / 100));
  const showDiscountPreview = discountVal > 0 && form.price > 0;

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? 'Editar Produto' : 'Adicionar Produto'} size="lg">
      <div className="flex gap-6">
        <form onSubmit={handleSubmit} className="flex-1 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Input label="Nome do Produto *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <Input label="SKU *" value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value.toUpperCase() })} disabled={isEdit} />
          </div>
          <Input label="Categoria *" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Quantidade *" type="number" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })} />
            <Input label="Preço *" type="number" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} />
          </div>

          {/* Default Discount */}
          <div className="flex flex-col gap-1.5">
            <label className="label-caps flex items-center gap-1.5">
              <Tag className="w-3 h-3 text-accent" />
              Desconto Padrão
              <span className="text-text-muted font-normal normal-case ml-1">(aplicado automaticamente no PDV)</span>
            </label>
            <div className="flex gap-2">
              <div className="flex-1">
                <input
                  type="number"
                  min="0"
                  max={defaultDiscountType === 'percentage' ? 100 : undefined}
                  step="0.01"
                  value={defaultDiscount}
                  onChange={(e) => setDefaultDiscount(e.target.value)}
                  placeholder={defaultDiscountType === 'percentage' ? 'Ex: 10' : 'Ex: 5.00'}
                  className="w-full bg-background border border-border rounded-md py-2 px-3 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent transition-colors font-mono"
                />
              </div>
              <TypeToggle
                value={defaultDiscountType}
                onChange={setDefaultDiscountType}
                options={[
                  { value: 'percentage', label: '%' },
                  { value: 'fixed', label: 'R$' },
                ]}
              />
            </div>
            {showDiscountPreview && (
              <div className="flex items-center gap-2 mt-1 px-3 py-2 bg-accent/8 border border-accent/20 rounded-md">
                <Tag className="w-3 h-3 text-accent flex-shrink-0" />
                <span className="text-xs text-text-secondary">
                  Preço com desconto:
                  <span className="font-mono font-semibold text-accent ml-1">
                    R$ {discountedPrice.toFixed(2)}
                  </span>
                  <span className="text-text-muted ml-1">
                    (era R$ {form.price.toFixed(2)})
                  </span>
                </span>
              </div>
            )}
          </div>

          <Input label="Local do Armazém" value={form.warehouseLocation} onChange={(e) => setForm({ ...form, warehouseLocation: e.target.value })} />
          <div className="flex flex-col gap-1.5">
            <label className="label-caps">Descrição</label>
            <textarea
              rows={3}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="bg-background border border-border rounded-md p-3 text-sm focus:outline-none focus:border-accent"
            />
          </div>
          <div className="flex gap-2 justify-end pt-2 border-t border-border">
            <Button type="button" variant="secondary" onClick={onClose}>Cancelar</Button>
            <Button type="submit" loading={submitting}>{isEdit ? 'Salvar Alterações' : 'Criar Produto'}</Button>
          </div>
        </form>

        <div className="w-56 border-l border-border pl-6 pt-1">
          <h3 className="label-caps mb-4 text-accent">Limite Crítico %</h3>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-text-primary block mb-3">Percentual de Aviso</label>
              <input
                type="range" min="0" max="100" value={percentualLimite}
                onChange={(e) => setPercentualLimite(Number(e.target.value))}
                className="w-full h-2 bg-surface-elevated rounded-lg appearance-none cursor-pointer accent-accent"
              />
            </div>
            <div className="bg-surface-elevated border border-border rounded-lg p-4">
              <div className="text-center">
                <div className="text-4xl font-bold text-accent">{percentualLimite}</div>
                <div className="text-xs text-text-muted mt-1">%</div>
              </div>
            </div>
            <div className="bg-accent/10 border border-accent/30 rounded-lg p-3">
              <p className="text-xs font-semibold text-text-primary mb-1">Equivalente:</p>
              <p className="text-sm font-mono font-bold text-accent">
                {form.quantity > 0 ? lowStockThreshold : '—'} unidades
              </p>
              <p className="text-xs text-text-muted mt-1">
                {form.quantity > 0 ? `Quando chegar a ${lowStockThreshold} unidades, aviso dispara.` : 'Defina a quantidade primeiro.'}
              </p>
            </div>
            <div className="text-xs text-text-secondary space-y-2">
              <div className={`flex justify-between items-center p-2 rounded border transition-colors ${percentualLimite <= 10 ? 'bg-status-critical/20 border-status-critical/40' : 'bg-status-critical/10 border-status-critical/20'}`}>
                <span>Crítico</span>
                <span className="font-mono font-semibold text-status-critical">0–10%</span>
              </div>
              <div className={`flex justify-between items-center p-2 rounded border transition-colors ${percentualLimite > 10 && percentualLimite <= 30 ? 'bg-amber-500/20 border-amber-500/40' : 'bg-amber-500/10 border-amber-500/20'}`}>
                <span>Baixo</span>
                <span className="font-mono font-semibold text-amber-400">11–30%</span>
              </div>
              <div className={`flex justify-between items-center p-2 rounded border transition-colors ${percentualLimite > 30 ? 'bg-accent/20 border-accent/40' : 'bg-accent/10 border-accent/20'}`}>
                <span>Normal</span>
                <span className="font-mono font-semibold text-accent">31–100%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}
