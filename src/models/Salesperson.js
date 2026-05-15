const mongoose = require('mongoose');

const SalespersonSchema = new mongoose.Schema(
  {
    // Optional link to the User account (admin DB) — used to identify which
    // Salesperson "is" the logged-in vendedor for privacy filters.
    // String (not ObjectId) because the User lives in a different connection.
    userId: {
      type: String,
      index: true,
      sparse: true,
    },
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    jobTitle: {
      type: String,
      trim: true,
    },
    // References the warehouse/unit this salesperson is assigned to.
    warehouseUnit: {
      type: String,
      trim: true,
    },
    salesTarget: {
      type: Number,
      default: 0,
      min: [0, 'Sales target cannot be negative'],
    },
    salesRealized: {
      type: Number,
      default: 0,
      min: [0, 'Realized sales cannot be negative'],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    // Avatar initials derived from name on the client; stored as URL if uploaded.
    avatarUrl: {
      type: String,
      select: false,
    },
  },
  { timestamps: true }
);

SalespersonSchema.virtual('achievementPercentage').get(function () {
  if (!this.salesTarget || this.salesTarget === 0) return 0;
  return Math.round((this.salesRealized / this.salesTarget) * 100);
});

SalespersonSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Salesperson', SalespersonSchema);
