/**
 * Constantes de validação compartilhadas
 * Frontend e backend usam as mesmas regras
 */

export const VALIDATION = {
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

  // Senha: mínimo 4 caracteres
  PASSWORD: {
    minLength: 4,
    message: 'Senha deve ter pelo menos 4 caracteres.',
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
export function validateUsername(username) {
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
export function validatePin(pin) {
  if (!pin) return 'PIN é obrigatório.';
  if (!VALIDATION.PIN.regex.test(pin)) {
    return VALIDATION.PIN.message;
  }
  return null;
}

/**
 * Valida senha conforme regras
 * @returns {string|null}
 */
export function validatePassword(password, isPIN = false) {
  if (!password) return 'Senha é obrigatória.';
  if (isPIN) return validatePin(password);
  if (password.length < VALIDATION.PASSWORD.minLength) {
    return VALIDATION.PASSWORD.message;
  }
  return null;
}

/**
 * Valida telefone conforme formato brasileiro
 * @returns {string|null}
 */
export function validatePhone(phone) {
  if (!phone) return null; // Telefone é opcional em muitos casos
  if (!VALIDATION.PHONE.regex.test(phone)) {
    return `Telefone inválido. Use o formato: ${VALIDATION.PHONE.placeholder}`;
  }
  return null;
}

/**
 * Valida desconto
 * @param {number} value - valor do desconto
 * @param {string} type - 'percentage' ou 'fixed'
 * @returns {string|null}
 */
export function validateDiscount(value, type = 'percentage') {
  if (value === null || value === undefined) return null;

  const numValue = parseFloat(value);
  if (isNaN(numValue)) return 'Desconto deve ser um número.';
  if (numValue < VALIDATION.DISCOUNT.minValue) return 'Desconto não pode ser negativo.';

  if (type === 'percentage' && numValue > VALIDATION.DISCOUNT.maxPercentage) {
    return `Desconto percentual não pode ultrapassar ${VALIDATION.DISCOUNT.maxPercentage}%.`;
  }

  return null;
}

/**
 * Valida quantidade
 * @returns {string|null}
 */
export function validateQuantity(qty) {
  const numValue = parseInt(qty);
  if (isNaN(numValue)) return 'Quantidade deve ser um número.';
  if (numValue < VALIDATION.QUANTITY.minValue) {
    return VALIDATION.QUANTITY.message;
  }
  return null;
}

/**
 * Valida preço
 * @returns {string|null}
 */
export function validatePrice(price) {
  const numValue = parseFloat(price);
  if (isNaN(numValue)) return 'Preço deve ser um número.';
  if (numValue < VALIDATION.PRICE.minValue) {
    return VALIDATION.PRICE.message;
  }
  return null;
}

/**
 * Roles e suas permissões
 */
export const ROLES = {
  MASTER: 'master',
  ADMIN: 'admin',
  LOJISTA: 'lojista',
  GERENTE: 'gerente',
  VENDEDOR: 'vendedor',
};

/**
 * Roles que requerem PIN em vez de senha
 */
export const PIN_ROLES = [ROLES.VENDEDOR, ROLES.GERENTE];

/**
 * Métodos de pagamento válidos
 */
export const PAYMENT_METHODS = ['DINHEIRO', 'PIX', 'CREDITO', 'DEBITO', 'FIADO'];

/**
 * Status de caixa
 */
export const CAIXA_STATUS = {
  ABERTO: 'aberto',
  FECHADO: 'fechado',
  CANCELADO: 'cancelado',
};
