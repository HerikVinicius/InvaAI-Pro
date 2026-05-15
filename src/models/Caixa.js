const mongoose = require('mongoose');

/**
 * Caixa = a single open/close cycle of the cash drawer (a "turno").
 * Each lojista can open as many caixas as they want; only one stays ABERTO
 * at a time per tenant — enforced in the controller, not the schema.
 */
const CaixaSchema = new mongoose.Schema(
  {
    status: {
      type: String,
      enum: ['ABERTO', 'FECHADO'],
      default: 'ABERTO',
      index: true,
    },
    openedAt: {
      type: Date,
      default: Date.now,
      required: true,
    },
    openedBy: {
      // userId of whoever opened the caixa
      type: String,
      required: true,
    },
    openedByName: {
      type: String,
      required: true,
    },
    initialAmount: {
      type: Number,
      default: 0,
      min: [0, 'Valor inicial não pode ser negativo.'],
    },
    closedAt: { type: Date },
    closedBy: { type: String },
    closedByName: { type: String },
    // Counted by the operator at closing time; lets us spot divergence vs. expected.
    countedAmount: { type: Number, min: 0 },
    // Snapshot of computed totals at closing — useful for the printed/exported report.
    summary: {
      entradas: { type: Number, default: 0 },
      saidas: { type: Number, default: 0 },
      saldoEsperado: { type: Number, default: 0 },
      diferenca: { type: Number, default: 0 },
    },
    observacao: { type: String, trim: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Caixa', CaixaSchema);
