const mongoose = require('mongoose');

const ClienteSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Nome do cliente é obrigatório.'],
      trim: true,
      maxlength: 120,
    },
    phone: {
      type: String,
      trim: true,
      maxlength: 30,
    },
    // Outstanding debt — positive means the customer owes the store.
    saldoDevedor: {
      type: Number,
      default: 0,
      min: [0, 'Saldo devedor não pode ser negativo.'],
    },
    isActive: { type: Boolean, default: true },
    observacao: { type: String, trim: true, maxlength: 500 },
  },
  { timestamps: true }
);

ClienteSchema.index({ name: 'text', phone: 'text' });

module.exports = mongoose.model('Cliente', ClienteSchema);
