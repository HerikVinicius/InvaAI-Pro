/**
 * Permission helper — Herança com Overrides.
 *
 * Cada permissão tem um valor padrão por role. Se o usuário tiver um override
 * gravado no perfil (campo !== null), ele prevalece sobre o padrão da role.
 *
 * Uso:
 *   const { can } = require('./permissionHelper');
 *   if (!can(req.user, 'permitir_abrir_caixa')) return error(res, '...', 403);
 */

// Permissões padrão por role.
// true  = acesso concedido por padrão
// false = acesso negado por padrão
const ROLE_DEFAULTS = {
  permitir_abrir_caixa: {
    master:   true,
    admin:    true,
    lojista:  true,
    gerente:  true,   // acesso permanente e irrestrito conforme especificação
    vendedor: false,
  },
  permitir_cadastrar_produto: {
    master:   true,
    admin:    true,
    lojista:  true,
    gerente:  true,   // acesso permanente e irrestrito conforme especificação
    vendedor: false,
  },
};

/**
 * Verifica se o usuário tem a permissão solicitada.
 *
 * @param {object} user  - req.user (deve ter .role e opcionalmente os campos de override)
 * @param {string} permission - chave da permissão (ex: 'permitir_abrir_caixa')
 * @returns {boolean}
 */
const can = (user, permission) => {
  if (!user) return false;

  // Se o usuário tem um override explícito (true ou false), ele prevalece.
  if (user[permission] !== null && user[permission] !== undefined) {
    return user[permission] === true;
  }

  // Caso contrário, usa o padrão da role.
  const defaults = ROLE_DEFAULTS[permission];
  if (!defaults) {
    // Permissão desconhecida — nega por segurança.
    return false;
  }
  return defaults[user.role] === true;
};

module.exports = { can, ROLE_DEFAULTS };
