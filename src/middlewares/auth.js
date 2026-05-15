const jwt = require('jsonwebtoken');
const { getTenantConnection } = require('../utils/connectionManager');
const { error } = require('../utils/apiResponse');
const { can } = require('../utils/permissionHelper');

/**
 * Verifies the Bearer JWT and injects req.user and req.db (tenant connection).
 *
 * Master users can override the tenant they're acting on by passing either
 * the `X-Tenant-Id` header or the `?tenant=` query param. This is what gives
 * master full access to every lojista database without having to log in as
 * each one.
 */
const protect = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return error(res, 'Authorization token missing or malformed.', 401);
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { id, name, username, role, tenantId }

    let activeTenantId = decoded.tenantId;
    if (decoded.role === 'master') {
      const override = req.headers['x-tenant-id'] || req.query.tenant;
      if (override && typeof override === 'string') {
        activeTenantId = override.trim();
      }
    }

    req.activeTenantId = activeTenantId;
    req.db = getTenantConnection(activeTenantId);
    next();
  } catch (err) {
    return error(res, 'Invalid or expired token.', 401);
  }
};

/**
 * Restricts a route to specific roles.
 * Usage: router.post('/route', protect, authorize('master'), handler)
 */
const authorize = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return error(
      res,
      `Access denied. Required role(s): ${roles.join(', ')}.`,
      403
    );
  }
  next();
};

/**
 * Middleware que verifica uma permissão usando o modelo de Herança com Overrides.
 * Usa permissionHelper.can() — override do perfil prevalece sobre o padrão da role.
 *
 * Usage: router.post('/abrir', protect, checkPermission('permitir_abrir_caixa'), handler)
 */
const checkPermission = (permission) => (req, res, next) => {
  if (!can(req.user, permission)) {
    return error(
      res,
      `Acesso negado. Você não tem permissão para: ${permission}.`,
      403
    );
  }
  next();
};

module.exports = { protect, authorize, checkPermission };
