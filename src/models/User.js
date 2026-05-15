const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

/**
 * Username rule:
 *   - lowercase letters, digits, dot and underscore
 *   - 3 to 30 characters
 *   - cannot start or end with dot/underscore
 */
const USERNAME_REGEX = /^(?![._])(?!.*[._]$)[a-z0-9._]{3,30}$/;

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Nome é obrigatório.'],
      trim: true,
      maxlength: [120, 'Nome não pode exceder 120 caracteres.'],
    },
    username: {
      type: String,
      required: [true, 'Username é obrigatório.'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [USERNAME_REGEX, 'Username inválido (use 3-30 letras, números, "." ou "_").'],
    },
    // Password format depends on role and is enforced in controllers:
    //   - vendedor: 4-digit PIN (only digits)
    //   - others:   8+ characters
    // Schema does NOT validate length — it just stores the bcrypt hash.
    password: {
      type: String,
      required: [true, 'Senha é obrigatória.'],
      select: false,
    },
    role: {
      type: String,
      enum: ['admin', 'master', 'lojista', 'vendedor', 'gerente'],
      default: 'vendedor',
    },
    aiChatEnabled: {
      type: Boolean,
      default: true,
    },
    tenantId: {
      type: String,
      required: [true, 'tenantId é obrigatório.'],
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    // Snapshot of the username right before a soft-delete (deactivation).
    // Letting us restore it on reactivation when the original handle is free.
    usernamePrevious: {
      type: String,
      lowercase: true,
      trim: true,
    },
    // Permission overrides — null means "use the role default", true/false overrides it.
    permitir_abrir_caixa: {
      type: Boolean,
      default: null,
    },
    permitir_cadastrar_produto: {
      type: Boolean,
      default: null,
    },
  },
  { timestamps: true }
);

UserSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
});

UserSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);
module.exports.USERNAME_REGEX = USERNAME_REGEX;
