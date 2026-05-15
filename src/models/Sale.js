const mongoose = require('mongoose');

const SaleItemSchema = new mongoose.Schema({
  productId: String,
  sku: String,
  name: String,
  quantity: { type: Number, required: true },
  unitPrice: { type: Number, required: true },
  discount: { type: Number, default: 0, min: 0 },
  discountType: { type: String, enum: ['percentage', 'fixed'], default: 'percentage' },
  total: { type: Number, required: true },
});

// Sub-documento para cada fatia de pagamento dividido
const PaymentSliceSchema = new mongoose.Schema({
  method: {
    type: String,
    enum: ['PIX', 'DINHEIRO', 'CREDITO', 'DEBITO', 'FIADO'],
    required: true,
  },
  amount: { type: Number, required: true, min: 0.01 },
  installments: { type: Number, default: 1, min: 1, max: 24 },
}, { _id: false });

const SaleSchema = new mongoose.Schema(
  {
    vendorId: { type: String, required: true },
    vendorName: { type: String, required: true },
    items: [SaleItemSchema],
    totalAmount: { type: Number, required: true },
    // Pagamento simples
    paymentMethod: {
      type: String,
      enum: ['PIX', 'DINHEIRO', 'CREDITO', 'DEBITO', 'FIADO', 'SPLIT'],
      required: true,
    },
    installments: { type: Number, default: 1, min: 1, max: 24 },
    // Pagamento dividido (preenchido apenas quando paymentMethod === 'SPLIT')
    payments: { type: [PaymentSliceSchema], default: undefined },

    // Caixa onde a venda foi registrada — usado pelo cancelamento para
    // validar se o caixa ainda está aberto.
    caixaId: { type: mongoose.Schema.Types.ObjectId, ref: 'Caixa', index: true },

    // Cliente (preenchido apenas quando há fiado/parcela em FIADO).
    clienteId: { type: mongoose.Schema.Types.ObjectId, ref: 'Cliente', index: true },
    clienteName: { type: String },

    subtotal: { type: Number },
    globalDiscount: { type: Number, default: 0, min: 0 },
    globalDiscountType: { type: String, enum: ['percentage', 'fixed'], default: 'percentage' },

    status: {
      type: String,
      enum: ['CONCLUIDA', 'CANCELADA'],
      default: 'CONCLUIDA',
      index: true,
    },
    cancelReason: { type: String, trim: true, maxlength: 500 },
    cancelledAt: { type: Date },
    cancelledBy: { type: String },
    cancelledByName: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Sale', SaleSchema);
