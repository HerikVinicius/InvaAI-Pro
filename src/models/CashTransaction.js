const mongoose = require('mongoose');

/**
 * Every movement of money in/out of a Caixa.
 * - Positive `amount` = entrada (VENDA, RECEBIMENTO)
 * - Negative `amount` = saída (SANGRIA, ESTORNO)
 *
 * SANGRIA and ESTORNO MUST carry a description for auditability —
 * enforced by the `required` validator below.
 */
const TYPES = ['VENDA', 'RECEBIMENTO', 'SANGRIA', 'ESTORNO'];

const CashTransactionSchema = new mongoose.Schema(
  {
    caixaId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Caixa',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: TYPES,
      required: true,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
      validate: {
        validator: Number.isFinite,
        message: 'amount must be a finite number.',
      },
    },
    description: {
      type: String,
      trim: true,
      maxlength: 500,
      required: [
        function () {
          return this.type === 'SANGRIA' || this.type === 'ESTORNO';
        },
        'Descrição é obrigatória para Sangrias e Estornos.',
      ],
    },
    paymentMethod: {
      type: String,
      enum: ['PIX', 'DINHEIRO', 'CREDITO', 'DEBITO', 'FIADO', 'SPLIT', null],
      default: null,
    },
    // Optional cross-references to the originating record.
    saleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Sale', index: true },
    clienteId: { type: mongoose.Schema.Types.ObjectId, ref: 'Cliente', index: true },
    // Who triggered the transaction (lojista/vendedor userId + name snapshot).
    createdBy: { type: String, required: true },
    createdByName: { type: String },
  },
  { timestamps: true }
);

// Signed amount sanity check based on type
CashTransactionSchema.pre('validate', function () {
  if (this.type === 'VENDA' || this.type === 'RECEBIMENTO') {
    if (this.amount < 0) this.amount = Math.abs(this.amount);
  }
  if (this.type === 'SANGRIA' || this.type === 'ESTORNO') {
    if (this.amount > 0) this.amount = -Math.abs(this.amount);
  }
});

module.exports = mongoose.model('CashTransaction', CashTransactionSchema);
module.exports.TYPES = TYPES;
