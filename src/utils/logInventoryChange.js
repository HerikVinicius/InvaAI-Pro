const InventoryLog = require('../models/InventoryLog');

/**
 * Writes a single audit entry to the tenant's `inventorylogs` collection.
 *
 * Designed to be fire-and-forget from controllers: if logging fails we
 * shouldn't break the originating business operation. Errors are logged
 * to the server console and swallowed.
 *
 *   await logInventoryChange(req, {
 *     product,            // mongoose Product document (for id/name/sku)
 *     action: 'SALE',
 *     quantityBefore,
 *     quantityAfter,
 *     delta,              // signed: + entrou / − saiu
 *     saleId,             // optional
 *     reason,             // optional
 *     changes,            // optional object snapshot of UPDATE diffs
 *     session,            // optional mongoose session (for transactions)
 *   });
 */
const logInventoryChange = async (req, payload) => {
  try {
    const {
      product,
      action,
      quantityBefore = 0,
      quantityAfter = 0,
      delta,
      saleId,
      reason,
      changes,
      session,
    } = payload;

    if (!req?.db || !product || !action) return;

    const TenantInventoryLog = req.db.models.InventoryLog
      || req.db.model('InventoryLog', InventoryLog.schema);

    const doc = {
      productId: product._id?.toString() || product.productId,
      productName: product.name || product.productName,
      sku: product.sku,
      action,
      quantityBefore,
      quantityAfter,
      delta: delta != null ? delta : quantityAfter - quantityBefore,
      changes,
      saleId,
      reason,
      changedBy: req.user.id,
      changedByName: req.user.name || req.user.username,
      changedByUsername: req.user.username,
    };

    if (session) {
      await TenantInventoryLog.create([doc], { session });
    } else {
      await TenantInventoryLog.create(doc);
    }
  } catch (err) {
    // Audit failure should not break the originating operation — just log.
    console.warn('[logInventoryChange] failed:', err.message);
  }
};

module.exports = { logInventoryChange };
