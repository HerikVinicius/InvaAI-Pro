const mongoose = require('mongoose');

const MonthlySalesSchema = new mongoose.Schema(
  {
    month: {
      type: String,
      required: [true, 'Month is required'],
      enum: ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'],
    },
    year: {
      type: Number,
      required: [true, 'Year is required'],
    },
    revenue: {
      type: Number,
      required: [true, 'Revenue is required'],
      min: [0, 'Revenue cannot be negative'],
      default: 0,
    },
    unitsSold: {
      type: Number,
      required: [true, 'Units sold is required'],
      min: [0, 'Units sold cannot be negative'],
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('MonthlySales', MonthlySalesSchema);
