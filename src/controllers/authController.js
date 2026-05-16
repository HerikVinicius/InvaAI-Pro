const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { success, error } = require('../utils/apiResponse');
const { getTenantConnection, slugifyTenant } = require('../utils/connectionManager');
const { seedTenantDatabase } = require('../utils/seedTenant');

const { USERNAME_REGEX } = User;

const normalizeUsername = (u) => (u || '').toString().trim().toLowerCase();

const signToken = (user) =>
  jwt.sign(
    {
      id: user._id,
      name: user.name,
      username: user.username,
      role: user.role,
      tenantId: user.tenantId,
      permitir_abrir_caixa:      user.permitir_abrir_caixa      ?? null,
      permitir_cadastrar_produto: user.permitir_cadastrar_produto ?? null,
    },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );

/**
 * POST /auth/register — public sign-up. Always creates as `lojista`,
 * provisioning a fresh tenant database (invaai_<tenantId>).
 */
const register = async (req, res) => {
  try {
    const { name, username, password } = req.body;

    if (!name || !username || !password) {
      return error(res, 'Nome, username e senha são obrigatórios.', 400);
    }
    if (password.length < 4) {
      return error(res, 'Senha deve ter pelo menos 4 caracteres.', 400);
    }

    const normalized = normalizeUsername(username);
    if (!USERNAME_REGEX.test(normalized)) {
      return error(res, 'Username inválido — use 3-30 letras, números, "." ou "_".', 400);
    }

    // tenantId derived from the store NAME (not the username) — each lojista's
    // store gets a dedicated database invaai_<slug>.
    const tenantId = slugifyTenant(name);
    if (!tenantId) {
      return error(res, 'Nome inválido para gerar identificador da loja.', 400);
    }

    const existingUsername = await User.findOne({ username: normalized });
    if (existingUsername) {
      return error(res, `Username "${normalized}" já está em uso.`, 409);
    }

    const existingTenant = await User.findOne({ tenantId });
    if (existingTenant) {
      return error(
        res,
        `Já existe uma loja com identificador "${tenantId}". Use um nome diferente.`,
        409
      );
    }

    const tenantConn = getTenantConnection(tenantId);
    await seedTenantDatabase(tenantConn, { tenantId, name, username: normalized });

    const user = await User.create({
      name,
      username: normalized,
      password,
      tenantId,
      role: 'lojista',
    });
    const token = signToken(user);

    return success(
      res,
      {
        token,
        user: {
          id: user._id,
          name: user.name,
          username: user.username,
          role: user.role,
          tenantId: user.tenantId,
        },
      },
      201
    );
  } catch (err) {
    console.error('[AuthController] register error:', err);
    return error(res, err.message || 'Falha no cadastro.', 400);
  }
};

/**
 * POST /auth/login — accepts `username` + `password`.
 */
const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return error(res, 'Informe username e senha.', 400);
    }

    const normalized = normalizeUsername(username);

    const user = await User.findOne({ username: normalized }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
      return error(res, 'Username ou senha inválidos.', 401);
    }

    if (!user.isActive) {
      return error(res, 'Conta desativada. Procure o lojista/administrador.', 403);
    }

    const token = signToken(user);

    return success(res, {
      token,
      user: {
        id: user._id,
        name: user.name,
        username: user.username,
        role: user.role,
        tenantId: user.tenantId,
        permitir_abrir_caixa:      user.permitir_abrir_caixa      ?? null,
        permitir_cadastrar_produto: user.permitir_cadastrar_produto ?? null,
      },
    });
  } catch (err) {
    console.error('[AuthController] login error:', err.message);
    return error(res, 'Falha no login.', 500);
  }
};

/**
 * GET /auth/me — retorna o usuário atual com dados frescos do banco.
 * Usado pelo frontend para sincronizar overrides de permissão sem forçar novo login.
 */
const me = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user || !user.isActive) {
      return error(res, 'Usuário não encontrado ou inativo.', 404);
    }
    return success(res, {
      user: {
        id: user._id,
        name: user.name,
        username: user.username,
        role: user.role,
        tenantId: user.tenantId,
        aiChatEnabled: user.aiChatEnabled,
        isActive: user.isActive,
        permitir_abrir_caixa:      user.permitir_abrir_caixa      ?? null,
        permitir_cadastrar_produto: user.permitir_cadastrar_produto ?? null,
      },
    });
  } catch (err) {
    console.error('[AuthController] me error:', err.message);
    return error(res, 'Falha ao buscar usuário.', 500);
  }
};

module.exports = { register, login, me };
