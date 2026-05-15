const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
      maxlength: [200, 'Product name cannot exceed 200 characters'],
    },
    sku: {
      type: String,
      required: [true, 'SKU is required'],
      unique: true,
      uppercase: true,
      trim: true,
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true,
    },
    quantity: {
      type: Number,
      required: [true, 'Quantity is required'],
      min: [0, 'Quantity cannot be negative'],
      default: 0,
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative'],
    },
    // HEALTHY | LOW_STOCK | CRITICAL — auto-derived but can be overridden.
    status: {
      type: String,
      enum: ['HEALTHY', 'LOW_STOCK', 'CRITICAL'],
      default: 'HEALTHY',
    },
    lowStockThreshold: {
      type: Number,
      default: 20,
    },
    lowStockPercent: {
      type: Number,
      default: 20,
      min: 0,
      max: 100,
    },
    warehouseLocation: {
      type: String,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    defaultDiscount: { type: Number, default: 0, min: 0 },
    defaultDiscountType: { type: String, enum: ['percentage', 'fixed'], default: 'percentage' },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// Recalcula threshold em unidades só quando o percentual for alterado (não a cada venda).
// Assim, o limite permanece fixo enquanto o estoque vai caindo.
ProductSchema.pre('save', function () {
  if (this.isModified('lowStockPercent') || this.isNew) {
    this.lowStockThreshold = Math.round(this.quantity * (this.lowStockPercent / 100));
  }

  if (this.quantity <= 0) {
    this.status = 'CRITICAL';
  } else if (this.quantity <= this.lowStockThreshold) {
    this.status = 'LOW_STOCK';
  } else {
    this.status = 'HEALTHY';
  }
});

module.exports = mongoose.model('Product', ProductSchema);
