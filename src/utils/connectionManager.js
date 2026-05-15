const mongoose = require('mongoose');

const ADMIN_DB_NAME = 'invaai_admin';
const TENANT_DB_PREFIX = 'invaai_';

// Cache of active tenant connections keyed by tenantId.
const tenantConnections = {};

/**
 * Builds a MongoDB URI with a specific database name, regardless of whether
 * the base URI already has one. Handles `mongodb://` and `mongodb+srv://`.
 */
const buildUri = (baseUri, dbName) => {
  return baseUri.replace(
    /^(mongodb(?:\+srv)?:\/\/[^/?#]+)([^?#]*)(\?[^#]*)?(.*)$/,
    (_, host, _path, query, rest) => `${host}/${dbName}${query || ''}${rest}`
  );
};

/**
 * Slugifies a name into a tenant identifier safe for use as a database name.
 * "João da Silva!" → "joao_da_silva"
 */
const slugifyTenant = (name) => {
  if (!name || typeof name !== 'string') return '';
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .substring(0, 40);
};

/**
 * Returns (or creates) a Mongoose connection scoped to the tenant's database.
 * Database name pattern: invaai_<tenantId>
 */
const getTenantConnection = (tenantId) => {
  if (!tenantId) {
    throw new Error('tenantId is required to open a tenant connection.');
  }

  if (tenantConnections[tenantId]) {
    return tenantConnections[tenantId];
  }

  const dbName = `${TENANT_DB_PREFIX}${tenantId}`;
  const uri = buildUri(process.env.MONGODB_URI, dbName);

  console.log(`[DB] Opening tenant connection → ${dbName}`);

  const conn = mongoose.createConnection(uri, {
    serverSelectionTimeoutMS: 5000,
  });

  conn.on('connected', () =>
    console.log(`[DB] Tenant connection ESTABLISHED → ${dbName}`)
  );
  conn.on('error', (err) =>
    console.error(`[DB] Tenant connection ERROR (${dbName}):`, err.message)
  );
  conn.on('disconnected', () =>
    console.warn(`[DB] Tenant connection CLOSED → ${dbName}`)
  );

  tenantConnections[tenantId] = conn;
  return conn;
};

/**
 * Waits until the given mongoose connection finishes its initial handshake.
 * Mongoose 6+ exposes `asPromise()` which races without listener-attach gaps.
 */
const waitForConnection = (conn) => {
  if (conn.readyState === 1) return Promise.resolve();
  if (typeof conn.asPromise === 'function') return conn.asPromise();
  return new Promise((resolve, reject) => {
    conn.once('connected', resolve);
    conn.once('error', reject);
  });
};

/**
 * Connects the global admin database (invaai_admin).
 * Call once at server startup.
 */
const connectAdminDB = async () => {
  try {
    const uri = buildUri(process.env.MONGODB_URI, ADMIN_DB_NAME);
    await mongoose.connect(uri);
    console.log(`[DB] Admin database connection ESTABLISHED → ${ADMIN_DB_NAME}`);
  } catch (err) {
    console.error('[DB] Admin database connection FAILED:', err.message);
    process.exit(1);
  }
};

/**
 * Lists every tenant database currently present in the cluster.
 * Used by master users to inspect / act on any tenant.
 */
const listTenantDatabases = async () => {
  const adminConn = mongoose.connection;
  const result = await adminConn.db.admin().listDatabases();
  return result.databases
    .filter((d) => d.name.startsWith(TENANT_DB_PREFIX) && d.name !== ADMIN_DB_NAME)
    .map((d) => ({
      dbName: d.name,
      tenantId: d.name.replace(TENANT_DB_PREFIX, ''),
      sizeOnDisk: d.sizeOnDisk,
    }));
};

module.exports = {
  connectAdminDB,
  getTenantConnection,
  listTenantDatabases,
  waitForConnection,
  buildUri,
  slugifyTenant,
  ADMIN_DB_NAME,
  TENANT_DB_PREFIX,
};
