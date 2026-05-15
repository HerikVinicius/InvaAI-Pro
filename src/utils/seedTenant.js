const Product = require('../models/Product');
const Salesperson = require('../models/Salesperson');
const Sale = require('../models/Sale');
const MonthlySales = require('../models/MonthlySales');
const Notification = require('../models/Notification');
const Caixa = require('../models/Caixa');
const CashTransaction = require('../models/CashTransaction');
const Cliente = require('../models/Cliente');
const InventoryLog = require('../models/InventoryLog');
const { waitForConnection } = require('./connectionManager');

const safeModel = (conn, name, schema) =>
  conn.models[name] || conn.model(name, schema);

/**
 * Tries to create a collection. Swallows the "NamespaceExists" / 48 error
 * that fires on subsequent calls — anything else gets surfaced.
 */
const ensureCollection = async (conn, name) => {
  try {
    await conn.db.createCollection(name);
  } catch (err) {
    // 48 = NamespaceExists
    if (err.code !== 48 && !/already exists/i.test(err.message || '')) {
      console.warn(`[Seed] createCollection(${name}) skipped:`, err.message);
    }
  }
};

/**
 * Provisions a new tenant database with the five core collections
 * (products, salespeople, sales, monthlysales, notifications).
 * Collections start empty — the lojista populates them.
 */
const seedTenantDatabase = async (conn, lojista) => {
  await waitForConnection(conn);

  // Register schemas on this connection so mongoose knows the collection names
  // (used by controllers via req.db.model('Product', ...) later on).
  safeModel(conn, 'Product', Product.schema);
  safeModel(conn, 'Salesperson', Salesperson.schema);
  safeModel(conn, 'Sale', Sale.schema);
  safeModel(conn, 'MonthlySales', MonthlySales.schema);
  safeModel(conn, 'Notification', Notification.schema);
  safeModel(conn, 'Caixa', Caixa.schema);
  safeModel(conn, 'CashTransaction', CashTransaction.schema);
  safeModel(conn, 'Cliente', Cliente.schema);
  safeModel(conn, 'InventoryLog', InventoryLog.schema);

  // Force creation of every collection — empty ones included — so the new
  // database actually appears in MongoDB and Compass shows the full layout.
  await Promise.all([
    ensureCollection(conn, 'products'),
    ensureCollection(conn, 'salespeople'),
    ensureCollection(conn, 'sales'),
    ensureCollection(conn, 'monthlysales'),
    ensureCollection(conn, 'notifications'),
    ensureCollection(conn, 'caixas'),
    ensureCollection(conn, 'cashtransactions'),
    ensureCollection(conn, 'clientes'),
    ensureCollection(conn, 'inventorylogs'),
  ]);

  console.log(
    `[Seed] Tenant "invaai_${lojista.tenantId}" provisioned (empty) with collections: ` +
    'products, salespeople, sales, monthlysales, notifications, caixas, cashtransactions, clientes, inventorylogs.'
  );
};

module.exports = { seedTenantDatabase };
