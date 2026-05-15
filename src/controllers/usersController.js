const User = require('../models/User');
const Salesperson = require('../models/Salesperson');
const { success, error } = require('../utils/apiResponse');
const { getTenantConnection } = require('../utils/connectionManager');

const { USERNAME_REGEX } = User;
const VALID_ROLES = ['master', 'admin', 'lojista', 'vendedor', 'gerente'];
const PIN_REGEX = /^\d{4}$/;

/**
 * Validates the plaintext password against the role-specific rule:
 *   - vendedor → exactly 4 numeric digits (PIN)
 *   - others   → 8+ characters
 * Returns null if valid, or an error message string.
 */
const validatePasswordForRole = (password, role) => {
  if (!password) return 'Senha é obrigatória.';
  if (role === 'vendedor' || role === 'gerente') {
    if (!PIN_REGEX.test(password)) {
      return 'PIN deve ter exatamente 4 dígitos numéricos.';
    }
    return null;
  }
  if (password.length < 8) {
    return 'Senha deve ter pelo menos 8 caracteres.';
  }
  return null;
};

// Hierarquia (do topo para baixo):
//   master   → banco main, pode TUDO (criar/editar masters, admins, lojistas, vendedores)
//   admin    → banco main, mas só atua em lojistas e vendedores (não toca em masters/admins)
//   lojista  → dono do tenant, cria/edita apenas vendedores do seu tenant
//   vendedor → sem permissões de gerenciar

// Filtro de busca de usuários conforme o role do requester.
const buildScopeFilter = (req) => {
  if (req.user.role === 'master') return {};
  if (req.user.role === 'admin')  return { role: { $in: ['lojista', 'vendedor', 'gerente'] } };
  if (req.user.role === 'lojista') return { tenantId: req.user.tenantId, role: { $in: ['vendedor', 'gerente'] } };
  return { _id: null }; // bloqueia qualquer outro role
};

// True se o requester pode visualizar/editar o usuário alvo.
const canActOnUser = (req, targetUser) => {
  if (req.user.role === 'master') return true;
  if (req.user.role === 'admin')  return ['lojista', 'vendedor', 'gerente'].includes(targetUser.role);
  if (req.user.role === 'lojista') {
    return targetUser.tenantId === req.user.tenantId && ['vendedor', 'gerente'].includes(targetUser.role);
  }
  return false;
};

const normalizeUsername = (u) => (u || '').toString().trim().toLowerCase();

const getAllUsers = async (req, res) => {
  try {
    const { search } = req.query;
    const filter = buildScopeFilter(req);

    // Live search by username OR name (case-insensitive).
    if (search && search.trim()) {
      const rx = new RegExp(search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      filter.$or = [{ username: rx }, { name: rx }];
    }

    const users = await User.find(filter)
      .select('-password')
      .sort({ createdAt: -1 });
    return success(res, { users });
  } catch (err) {
    console.error('[UsersController] getAllUsers error:', err.message);
    return error(res, 'Falha ao buscar usuários.', 500);
  }
};

const getUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId).select('-password');
    if (!user) return error(res, 'Usuário não encontrado.', 404);
    if (!canActOnUser(req, user)) return error(res, 'Acesso negado.', 403);
    return success(res, { user });
  } catch (err) {
    console.error('[UsersController] getUser error:', err.message);
    return error(res, 'Falha ao buscar usuário.', 500);
  }
};

const createUser = async (req, res) => {
  try {
    const { name, username, password, role, tenantId } = req.body;

    if (!name || !username || !password) {
      return error(res, 'Nome, username e senha são obrigatórios.', 400);
    }
    const normalized = normalizeUsername(username);
    if (!USERNAME_REGEX.test(normalized)) {
      return error(res, 'Username inválido — use 3-30 letras, números, "." ou "_".', 400);
    }

    let targetRole = role || 'vendedor';

    // Role-aware password format (PIN for vendedor, 8+ for everyone else).
    const passwordError = validatePasswordForRole(password, targetRole);
    if (passwordError) return error(res, passwordError, 400);

    let targetTenantId;

    if (req.user.role === 'master') {
      if (!VALID_ROLES.includes(targetRole)) {
        return error(res, 'Role inválido.', 400);
      }
      targetTenantId = tenantId || req.user.tenantId;
    } else if (req.user.role === 'admin') {
      if (!['lojista', 'vendedor', 'gerente'].includes(targetRole)) {
        return error(res, 'Admin só pode criar lojistas, vendedores ou gerentes.', 403);
      }
      targetTenantId = tenantId || req.user.tenantId;
    } else if (req.user.role === 'lojista') {
      if (!['vendedor', 'gerente'].includes(targetRole)) {
        return error(res, 'Lojista só pode criar vendedores ou gerentes.', 403);
      }
      targetTenantId = req.user.tenantId;
    } else {
      return error(res, 'Acesso negado.', 403);
    }

    const existing = await User.findOne({ username: normalized });
    if (existing) return error(res, `Username "${normalized}" já está em uso.`, 409);

    const user = await User.create({
      name,
      username: normalized,
      password,
      role: targetRole,
      tenantId: targetTenantId,
    });

    // When the new user is a vendedor or gerente, also provision a matching
    // Salesperson record in the tenant's database linked via userId. This is
    // what lets us identify "my sales" later when they log in.
    if (['vendedor', 'gerente'].includes(targetRole)) {
      try {
        const tenantConn = getTenantConnection(targetTenantId);
        const TenantSalesperson = tenantConn.models.Salesperson || tenantConn.model('Salesperson', Salesperson.schema);
        await TenantSalesperson.create({
          userId: user._id.toString(),
          name: user.name,
          jobTitle: targetRole === 'gerente' ? 'Gerente' : 'Vendedor',
          isActive: true,
        });
      } catch (linkErr) {
        // Don't fail the whole request — log so the lojista can re-link if needed.
        console.warn('[UsersController] createUser: salesperson link failed:', linkErr.message);
      }
    }

    return success(res, {
      user: {
        _id: user._id,
        name: user.name,
        username: user.username,
        role: user.role,
        tenantId: user.tenantId,
        aiChatEnabled: user.aiChatEnabled,
        isActive: user.isActive,
      },
    }, 201);
  } catch (err) {
    console.error('[UsersController] createUser error:', err.message);
    return error(res, err.message || 'Falha ao criar usuário.', 400);
  }
};

const toggleAiChat = async (req, res) => {
  try {
    const { userId } = req.params;
    const { aiChatEnabled } = req.body;

    const user = await User.findById(userId);
    if (!user) return error(res, 'Usuário não encontrado.', 404);

    if (!canActOnUser(req, user)) {
      return error(res, 'Acesso negado.', 403);
    }

    user.aiChatEnabled = aiChatEnabled;
    await user.save();

    return success(res, {
      message: `Chat de IA ${aiChatEnabled ? 'ativado' : 'desativado'} para ${user.name}.`,
      user: {
        id: user._id,
        name: user.name,
        username: user.username,
        aiChatEnabled: user.aiChatEnabled,
      },
    });
  } catch (err) {
    console.error('[UsersController] toggleAiChat error:', err.message);
    return error(res, err.message || 'Falha ao atualizar permissão.', 400);
  }
};

const updateUserRole = async (req, res) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;

    if (!VALID_ROLES.includes(role)) {
      return error(res, 'Role inválido. Use: master, admin, lojista ou vendedor.', 400);
    }

    if (!['master', 'admin'].includes(req.user.role)) {
      return error(res, 'Apenas master e admin podem alterar funções.', 403);
    }

    const user = await User.findById(userId);
    if (!user) return error(res, 'Usuário não encontrado.', 404);

    // Hardening: ninguém pode alterar o próprio role (defensive against the spec's
    // "Impedir alteração de role pelo próprio usuário").
    if (user._id.toString() === req.user.id) {
      return error(res, 'Você não pode alterar seu próprio role.', 403);
    }

    if (!canActOnUser(req, user)) {
      return error(res, 'Acesso negado.', 403);
    }

    if (req.user.role === 'admin' && ['master', 'admin'].includes(role)) {
      return error(res, 'Admin não pode promover usuários a master ou admin.', 403);
    }

    user.role = role;
    await user.save();

    return success(res, {
      message: `Função do usuário atualizada para ${role}.`,
      user: {
        id: user._id,
        name: user.name,
        username: user.username,
        role: user.role,
      },
    });
  } catch (err) {
    console.error('[UsersController] updateUserRole error:', err.message);
    return error(res, err.message || 'Falha ao atualizar função.', 400);
  }
};

/**
 * PUT /users/:userId/active — soft-delete with username release.
 *
 * On deactivate: stashes the current username into `usernamePrevious`, then
 *   suffixes the live username with `_inactive_<timestamp>` so the original
 *   handle is freed for reuse.
 *
 * On reactivate: attempts to restore the original username from
 *   `usernamePrevious`; if it was meanwhile taken, the suffixed handle stays
 *   and the operator is informed via the response message.
 *
 * Historical records reference users by _id, so audit integrity is preserved.
 */
const toggleUserActive = async (req, res) => {
  try {
    const { userId } = req.params;
    const { isActive } = req.body;

    const user = await User.findById(userId);
    if (!user) return error(res, 'Usuário não encontrado.', 404);

    if (!canActOnUser(req, user)) {
      return error(res, 'Acesso negado.', 403);
    }

    if (user._id.toString() === req.user.id && !isActive) {
      return error(res, 'Você não pode desativar sua própria conta.', 403);
    }

    let extraMessage = '';

    if (isActive === false) {
      // ── Deactivate: free the original username ────────────────────────
      const originalUsername = user.username;
      const suffix = `_inactive_${Date.now()}`;
      // Trim to fit within the 30-char username cap (regex max).
      const base = originalUsername.substring(0, 30 - suffix.length);
      user.usernamePrevious = originalUsername;
      user.username = `${base}${suffix}`;
      user.isActive = false;
      console.log(`[Users] Deactivated @${originalUsername} → @${user.username} (handle freed)`);
    } else if (isActive === true) {
      // ── Reactivate: try to restore the original handle ───────────────
      if (user.usernamePrevious) {
        const taken = await User.findOne({
          username: user.usernamePrevious,
          _id: { $ne: user._id },
        });
        if (!taken) {
          const restored = user.usernamePrevious;
          user.username = restored;
          user.usernamePrevious = undefined;
          console.log(`[Users] Reactivated, restored handle @${restored}`);
        } else {
          extraMessage = ` O username original "@${user.usernamePrevious}" foi assumido por outro usuário — mantive "@${user.username}".`;
          console.log(`[Users] Reactivated, original @${user.usernamePrevious} already taken — kept @${user.username}`);
        }
      }
      user.isActive = true;
    }

    await user.save();

    return success(res, {
      message: `Usuário ${user.isActive ? 'ativado' : 'desativado'}.${extraMessage}`,
      user: {
        id: user._id,
        name: user.name,
        username: user.username,
        usernamePrevious: user.usernamePrevious,
        isActive: user.isActive,
      },
    });
  } catch (err) {
    console.error('[UsersController] toggleUserActive error:', err.message);
    return error(res, err.message || 'Falha ao atualizar status.', 400);
  }
};

/**
 * PATCH /users/:userId — edit basic profile fields and permission overrides.
 * Username is intentionally immutable to keep audit logs stable.
 *
 * Campos aceitos:
 *   - name                      (string)
 *   - permitir_abrir_caixa      (boolean | null)
 *   - permitir_cadastrar_produto (boolean | null)
 *
 * Apenas master, admin ou lojista do mesmo tenant podem alterar overrides.
 * Lojista só altera usuários do próprio tenant (já garantido por canActOnUser).
 */
const updateUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { name, permitir_abrir_caixa, permitir_cadastrar_produto } = req.body;

    const hasName      = name !== undefined;
    const hasOverrides = permitir_abrir_caixa !== undefined || permitir_cadastrar_produto !== undefined;

    if (!hasName && !hasOverrides) {
      return error(res, 'Informe ao menos um campo para atualizar (name, permitir_abrir_caixa, permitir_cadastrar_produto).', 400);
    }

    if (hasName && !name.trim()) {
      return error(res, 'Nome não pode ser vazio.', 400);
    }

    // Valida os valores de override — aceita true, false ou null (reset ao padrão da role).
    const OVERRIDE_KEYS = ['permitir_abrir_caixa', 'permitir_cadastrar_produto'];
    for (const key of OVERRIDE_KEYS) {
      const val = req.body[key];
      if (val !== undefined && val !== true && val !== false && val !== null) {
        return error(res, `Campo "${key}" deve ser true, false ou null.`, 400);
      }
    }

    const user = await User.findById(userId);
    if (!user) return error(res, 'Usuário não encontrado.', 404);

    if (!canActOnUser(req, user)) {
      return error(res, 'Acesso negado.', 403);
    }

    if (hasName) user.name = name.trim();

    if (permitir_abrir_caixa !== undefined) {
      user.permitir_abrir_caixa = permitir_abrir_caixa;
    }
    if (permitir_cadastrar_produto !== undefined) {
      user.permitir_cadastrar_produto = permitir_cadastrar_produto;
    }

    await user.save();

    return success(res, {
      user: {
        id: user._id,
        name: user.name,
        username: user.username,
        role: user.role,
        permitir_abrir_caixa: user.permitir_abrir_caixa,
        permitir_cadastrar_produto: user.permitir_cadastrar_produto,
      },
    });
  } catch (err) {
    console.error('[UsersController] updateUser error:', err.message);
    return error(res, err.message || 'Falha ao atualizar usuário.', 400);
  }
};

/**
 * POST /users/:userId/reset-password — admin-side password reset.
 *
 * No email channel exists, so this is the ONLY way a forgotten password
 * is recovered. Permission is gated by the same canActOnUser hierarchy:
 *   - master  → resets anyone except themselves
 *   - admin   → resets lojista/vendedor (not masters/admins)
 *   - lojista → resets vendedores of their own tenant
 */
const resetPassword = async (req, res) => {
  try {
    const { userId } = req.params;
    const { newPassword } = req.body;

    if (!newPassword) {
      return error(res, 'Nova senha é obrigatória.', 400);
    }

    const user = await User.findById(userId).select('+password');
    if (!user) return error(res, 'Usuário não encontrado.', 404);

    const passwordError = validatePasswordForRole(newPassword, user.role);
    if (passwordError) return error(res, passwordError, 400);

    if (user._id.toString() === req.user.id) {
      return error(res, 'Use o fluxo "Alterar minha senha" para resetar a própria senha.', 403);
    }

    if (!canActOnUser(req, user)) {
      return error(res, 'Acesso negado.', 403);
    }

    user.password = newPassword; // pre('save') hook re-hashes
    await user.save();

    console.log(`[Users] Password reset for @${user.username} by @${req.user.username}`);

    return success(res, {
      message: `Senha de @${user.username} redefinida.`,
      user: { id: user._id, name: user.name, username: user.username },
    });
  } catch (err) {
    console.error('[UsersController] resetPassword error:', err.message);
    return error(res, err.message || 'Falha ao redefinir senha.', 400);
  }
};

module.exports = {
  getAllUsers,
  getUser,
  createUser,
  updateUser,
  toggleAiChat,
  updateUserRole,
  toggleUserActive,
  resetPassword,
};
