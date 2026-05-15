const User = require('../models/User');
const { listTenantDatabases, getTenantConnection } = require('../utils/connectionManager');
const { success, error } = require('../utils/apiResponse');

/**
 * Lists every tenant database in the cluster, plus a count of users per tenant
 * (resolved from the global User collection in invaai_admin). Master only.
 */
const listTenants = async (req, res) => {
  try {
    const dbs = await listTenantDatabases();

    const userCounts = await User.aggregate([
      { $group: { _id: '$tenantId', total: { $sum: 1 } } },
    ]);
    const countsByTenant = Object.fromEntries(userCounts.map((u) => [u._id, u.total]));

    const tenants = dbs.map((d) => ({
      tenantId: d.tenantId,
      dbName: d.dbName,
      sizeOnDisk: d.sizeOnDisk,
      userCount: countsByTenant[d.tenantId] || 0,
    }));

    return success(res, { tenants });
  } catch (err) {
    console.error('[TenantsController] listTenants error:', err.message);
    return error(res, 'Falha ao listar tenants.', 500);
  }
};

module.exports = { listTenants };
