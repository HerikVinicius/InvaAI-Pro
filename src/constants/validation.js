/**
 * Constantes de validação compartilhadas
 * Mantém simetria entre frontend e backend
 */

const VALIDATION = {
  // Username: 3-30 chars, alphanumeric + . e _, não pode começar/terminar com . ou _
  USERNAME: {
    regex: /^(?![._])(?!.*[._]$)[a-z0-9._]{3,30}$/,
    message: 'Username inválido — use 3-30 letras, números, "." ou "_".',
    minLength: 3,
    maxLength: 30,
  },

  // PIN: exatamente 4 dígitos numéricos
  PIN: {
    regex: /^\d{4}$/,
    message: 'PIN deve ter exatamente 4 dígitos numéricos.',
    length: 4,
  },

  // Senha: mínimo 8 caracteres
  PASSWORD: {
    minLength: 8,
    message: 'Senha deve ter pelo menos 8 caracteres.',
  },

  // Telefone: (00) 00000-0000
  PHONE: {
    regex: /^\(\d{2}\)\s?\d{4,5}-\d{4}$/,
    placeholder: '(00) 00000-0000',
  },

  // Desconto: 0-100 se percentual, positivo se fixo
  DISCOUNT: {
    minValue: 0,
    maxPercentage: 100,
  },

  // Quantidade: inteiros positivos
  QUANTITY: {
    minValue: 1,
    message: 'Quantidade deve ser maior que zero.',
  },

  // Preço: valores positivos com até 2 casas decimais
  PRICE: {
    minValue: 0.01,
    maxDecimals: 2,
    message: 'Preço deve ser maior que zero.',
  },
};

/**
 * Valida username conforme regras
 * @returns {string|null} null se válido, mensagem de erro se inválido
 */
function validateUsername(username) {
  if (!username) return 'Username é obrigatório.';
  if (username.length < VALIDATION.USERNAME.minLength) {
    return `Username deve ter no mínimo ${VALIDATION.USERNAME.minLength} caracteres.`;
  }
  if (username.length > VALIDATION.USERNAME.maxLength) {
    return `Username pode ter no máximo ${VALIDATION.USERNAME.maxLength} caracteres.`;
  }
  if (!VALIDATION.USERNAME.regex.test(username)) {
    return VALIDATION.USERNAME.message;
  }
  return null;
}

/**
 * Valida PIN conforme regras
 * @returns {string|null}
 */
function validatePin(pin) {
  if (!pin) return 'PIN é obrigatório.';
  if (!VALIDATION.PIN.regex.test(pin)) {
    return VALIDATION.PIN.message;
  }
  return null;
}

/**
 * Valida senha conforme regras
 * @param {string} password
 * @param {boolean} isPIN - se deve validar como PIN ou senha
 * @returns {string|null}
 */
function validatePassword(password, isPIN = false) {
  if (!password) return 'Senha é obrigatória.';
  if (isPIN) return validatePin(password);
  if (password.length < VALIDATION.PASSWORD.minLength) {
    return VALIDATION.PASSWORD.message;
  }
  return null;
}

/**
 * Roles e suas permissões
 */
const ROLES = {
  MASTER: 'master',
  ADMIN: 'admin',
  LOJISTA: 'lojista',
  GERENTE: 'gerente',
  VENDEDOR: 'vendedor',
};

/**
 * Roles que requerem PIN em vez de senha
 */
const PIN_ROLES = [ROLES.VENDEDOR, ROLES.GERENTE];

/**
 * Métodos de pagamento válidos
 */
const PAYMENT_METHODS = ['DINHEIRO', 'PIX', 'CREDITO', 'DEBITO', 'FIADO'];

/**
 * Status de caixa
 */
const CAIXA_STATUS = {
  ABERTO: 'aberto',
  FECHADO: 'fechado',
  CANCELADO: 'cancelado',
};

module.exports = {
  VALIDATION,
  validateUsername,
  validatePin,
  validatePassword,
  ROLES,
  PIN_ROLES,
  PAYMENT_METHODS,
  CAIXA_STATUS,
};
