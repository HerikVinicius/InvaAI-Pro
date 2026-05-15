const mongoose = require('mongoose');

const TenantConfigSchema = new mongoose.Schema(
  {
    // Store/Loja information
    storeName: {
      type: String,
      trim: true,
      default: '',
    },
    cnpj: {
      type: String,
      trim: true,
      default: '00.000.000/0000-00',
    },
    address: {
      type: String,
      trim: true,
      default: '',
    },
    phone: {
      type: String,
      trim: true,
      default: '',
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: '',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('TenantConfig', TenantConfigSchema);
