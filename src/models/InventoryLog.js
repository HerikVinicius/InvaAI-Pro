const mongoose = require('mongoose');

const ACTIONS = [
  'CREATE',         // produto cadastrado
  'UPDATE',         // edição manual (qty, preço, etc.)
  'DELETE',         // exclusão
  'SALE',           // saída por venda
  'CANCEL_RESTORE', // entrada por cancelamento de venda
];

/**
 * Per-tenant immutable log of every stock movement.
 * Lives in the tenant DB (next to products/sales) — same isolation rules.
 */
const InventoryLogSchema = new mongoose.Schema(
  {
    productId: { type: String, required: true, index: true },
    productName: { type: String, required: true },
    sku: { type: String, required: true, index: true },

    action: {
      type: String,
      enum: ACTIONS,
      required: true,
      index: true,
    },

    quantityBefore: { type: Number, default: 0 },
    quantityAfter: { type: Number, default: 0 },
    // Positive = entrou estoque; negativo = saiu. Calculado pelo caller.
    delta: { type: Number, default: 0 },

    // Snapshot of fields that may have changed in UPDATE actions.
    // Free-form to absorb price changes, threshold tweaks, etc.
    changes: { type: mongoose.Schema.Types.Mixed },

    // Optional cross-references when triggered by sale/cancel.
    saleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Sale', index: true },

    // Optional reason text (used by future "ajuste manual" feature).
    reason: { type: String, trim: true, maxlength: 500 },

    // Who triggered (snapshot — never falls back to "system").
    changedBy: { type: String, required: true },
    changedByName: { type: String },
    changedByUsername: { type: String },
  },
  { timestamps: true }
);

// Helpful compound index for "history of a product, newest first".
InventoryLogSchema.index({ productId: 1, createdAt: -1 });

module.exports = mongoose.model('InventoryLog', InventoryLogSchema);
module.exports.ACTIONS = ACTIONS;
