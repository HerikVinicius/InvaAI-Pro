const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema(
  {
    productId: { type: String, required: true },
    productName: { type: String, required: true },
    sku: { type: String, required: true },
    currentQuantity: { type: Number, required: true },
    lowStockThreshold: { type: Number, required: true },
    type: {
      type: String,
      enum: ['LOW_STOCK', 'CRITICAL_STOCK'],
      default: 'LOW_STOCK',
    },
    message: { type: String, required: true },
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Notification', NotificationSchema);
