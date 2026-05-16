const Product = require('../models/Product');
const InventoryLog = require('../models/InventoryLog');
const { success, error } = require('../utils/apiResponse');
const { createNotification } = require('./notificationsController');
const { logInventoryChange } = require('../utils/logInventoryChange');

/**
 * Returns a Product model bound to the authenticated user's tenant connection.
 */
const getTenantProductModel = (req) => req.db.model('Product', Product.schema);

/**
 * Projection string applied to every query for non-lojista roles.
 * purchasePrice must never reach the client-side network layer for employees.
 */
const COST_FIELDS_PROJECTION = '-purchasePrice';
const canSeeCost = (req) => req.user?.role === 'lojista';

const getInventory = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const skip = (page - 1) * limit;

    const filter = { isActive: true };

    // lowStock=true retorna apenas produtos com estoque abaixo do limite de aviso (LOW_STOCK ou CRITICAL).
    // Tem precedência sobre o filtro de status individual.
    if (req.query.lowStock === 'true') {
      filter.status = { $in: ['LOW_STOCK', 'CRITICAL'] };
    } else if (req.query.status) {
      filter.status = req.query.status.toUpperCase();
    }

    if (req.query.category) filter.category = new RegExp(req.query.category, 'i');
    if (req.query.search) {
      filter.$or = [
        { name: new RegExp(req.query.search, 'i') },
        { sku: new RegExp(req.query.search, 'i') },
      ];
    }

    const TenantProduct = getTenantProductModel(req);
    const projection = canSeeCost(req) ? null : COST_FIELDS_PROJECTION;
    const [products, total] = await Promise.all([
      TenantProduct.find(filter, projection).skip(skip).limit(limit).sort({ updatedAt: -1 }),
      TenantProduct.countDocuments(filter),
    ]);

    return success(res, {
      products,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    console.error('[InventoryController] getInventory error:', err.message);
    return error(res, 'Failed to fetch inventory.', 500);
  }
};

const addProduct = async (req, res) => {
  try {
    const { name, sku, category, quantity, price, warehouseLocation, description, lowStockPercent, defaultDiscount, defaultDiscountType } = req.body;

    const TenantProduct = getTenantProductModel(req);

    const existing = await TenantProduct.findOne({ sku: sku.toUpperCase() });
    if (existing) {
      return error(res, `SKU "${sku.toUpperCase()}" already exists.`, 409);
    }

    const productData = {
      name, sku, category, quantity, price, warehouseLocation, description, lowStockPercent,
      defaultDiscount: defaultDiscount ?? 0,
      defaultDiscountType: defaultDiscountType || 'percentage',
    };

    // purchasePrice is sensitive — only persisted when the authenticated user is a lojista.
    if (canSeeCost(req) && req.body.purchasePrice !== undefined) {
      productData.purchasePrice = Number(req.body.purchasePrice);
    }

    const product = await TenantProduct.create(productData);

    await logInventoryChange(req, {
      product,
      action: 'CREATE',
      quantityBefore: 0,
      quantityAfter: product.quantity,
      delta: product.quantity,
      changes: { name, sku, category, price, lowStockPercent },
    });

    // Strip cost from response for non-lojista callers (edge case: future role change mid-session).
    const responseProduct = canSeeCost(req) ? product : product.toObject({ versionKey: false });
    if (!canSeeCost(req)) delete responseProduct.purchasePrice;

    return success(res, { product: responseProduct }, 201);
  } catch (err) {
    console.error('[InventoryController] addProduct error:', err.message);
    return error(res, err.message || 'Failed to create product.', 400);
  }
};

const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const allowed = ['name', 'category', 'quantity', 'price', 'warehouseLocation', 'description', 'lowStockPercent', 'isActive', 'defaultDiscount', 'defaultDiscountType'];
    // purchasePrice can only be updated by lojista — silently ignored for all other roles.
    if (canSeeCost(req)) allowed.push('purchasePrice');
    const updates = {};
    const diffs = {};
    allowed.forEach((key) => { if (req.body[key] !== undefined) updates[key] = req.body[key]; });

    const TenantProduct = getTenantProductModel(req);
    const product = await TenantProduct.findById(id);
    if (!product) return error(res, 'Product not found.', 404);

    // Capture before/after for the audit log.
    const before = {};
    Object.keys(updates).forEach((k) => {
      before[k] = product[k];
      if (updates[k] !== product[k]) diffs[k] = { from: product[k], to: updates[k] };
    });
    const oldQuantity = product.quantity;

    Object.assign(product, updates);
    await product.save(); // triggers pre-save status recomputation

    // Low-stock notification on manual quantity drop.
    if (updates.quantity !== undefined && updates.quantity < oldQuantity && product.quantity <= product.lowStockThreshold) {
      const notificationType = product.quantity === 0 ? 'CRITICAL_STOCK' : 'LOW_STOCK';
      const message = product.quantity === 0
        ? `${product.name} está fora de estoque!`
        : `${product.name} chegou ao limite baixo (${product.quantity}/${product.lowStockThreshold})`;

      await createNotification(req.db, {
        productId: product._id.toString(),
        productName: product.name,
        sku: product.sku,
        currentQuantity: product.quantity,
        lowStockThreshold: product.lowStockThreshold,
        type: notificationType,
        message,
      });
    }

    if (Object.keys(diffs).length > 0) {
      await logInventoryChange(req, {
        product,
        action: 'UPDATE',
        quantityBefore: oldQuantity,
        quantityAfter: product.quantity,
        delta: product.quantity - oldQuantity,
        changes: diffs,
        reason,
      });
    }

    const responseProduct = canSeeCost(req) ? product : (() => {
      const obj = product.toObject({ versionKey: false });
      delete obj.purchasePrice;
      return obj;
    })();

    return success(res, { product: responseProduct });
  } catch (err) {
    console.error('[InventoryController] updateProduct error:', err.message);
    return error(res, err.message || 'Failed to update product.', 400);
  }
};

const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const TenantProduct = getTenantProductModel(req);
    const product = await TenantProduct.findById(id);
    if (!product) return error(res, 'Produto não encontrado.', 404);

    // Snapshot before deletion so the log can still reference name/sku.
    const snapshot = {
      _id: product._id,
      name: product.name,
      sku: product.sku,
      quantity: product.quantity,
    };

    await TenantProduct.findByIdAndDelete(id);

    await logInventoryChange(req, {
      product: snapshot,
      action: 'DELETE',
      quantityBefore: snapshot.quantity,
      quantityAfter: 0,
      delta: -snapshot.quantity,
      reason,
    });

    return success(res, { message: 'Produto deletado.' });
  } catch (err) {
    console.error('[InventoryController] deleteProduct error:', err.message);
    return error(res, err.message || 'Falha ao deletar produto.', 400);
  }
};

const getProductBySku = async (req, res) => {
  try {
    const { sku } = req.params;
    const TenantProduct = getTenantProductModel(req);
    const projection = canSeeCost(req) ? null : COST_FIELDS_PROJECTION;
    const product = await TenantProduct.findOne({ sku: sku.toUpperCase(), isActive: true }, projection);

    if (!product) {
      return error(res, 'Produto não registrado.', 404);
    }

    return success(res, { product });
  } catch (err) {
    console.error('[InventoryController] getProductBySku error:', err.message);
    return error(res, 'Falha ao buscar produto.', 500);
  }
};

/**
 * GET /inventory/search?q=<term> — hybrid search.
 * Tries exact SKU match first; if none, falls back to partial name match.
 * Returns up to 10 active products.
 */
const searchProducts = async (req, res) => {
  try {
    const q = (req.query.q || '').trim();
    if (!q) return success(res, { products: [] });

    const TenantProduct = getTenantProductModel(req);
    const skuUpper = q.toUpperCase();

    const projection = canSeeCost(req) ? null : COST_FIELDS_PROJECTION;

    // Exact SKU hit first (fast path — used by barcode scanners).
    const exactSku = await TenantProduct.findOne({ sku: skuUpper, isActive: true }, projection);
    if (exactSku) return success(res, { products: [exactSku], mode: 'sku' });

    // Partial name search (case-insensitive regex).
    const byName = await TenantProduct.find(
      { name: new RegExp(q, 'i'), isActive: true },
      projection,
      { limit: 10, sort: { name: 1 } }
    );

    // Also partial SKU prefix match for scanners that transmit partial codes.
    const bySku = await TenantProduct.find(
      { sku: new RegExp(`^${skuUpper}`), isActive: true, _id: { $nin: byName.map((p) => p._id) } },
      projection,
      { limit: 10 - byName.length }
    );

    return success(res, { products: [...byName, ...bySku], mode: 'name' });
  } catch (err) {
    console.error('[InventoryController] searchProducts error:', err.message);
    return error(res, 'Falha ao buscar produtos.', 500);
  }
};

/**
 * GET /inventory/logs — paginated audit log for the whole tenant.
 * Filters: ?productId=, ?sku=, ?action=, ?from=, ?to=
 */
const getInventoryLogs = async (req, res) => {
  try {
    const TenantInventoryLog = req.db.model('InventoryLog', InventoryLog.schema);
    const { productId, sku, action, from, to, limit = 100 } = req.query;

    const filter = {};
    if (productId) filter.productId = productId;
    if (sku) filter.sku = sku.toUpperCase();
    if (action) filter.action = action;
    if (from || to) {
      filter.createdAt = {};
      if (from) filter.createdAt.$gte = new Date(from);
      if (to) filter.createdAt.$lte = new Date(to);
    }

    const logs = await TenantInventoryLog.find(filter)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    return success(res, { logs });
  } catch (err) {
    console.error('[InventoryController] getInventoryLogs error:', err.message);
    return error(res, 'Falha ao buscar logs.', 500);
  }
};

/**
 * GET /inventory/:id/logs — audit log scoped to one product.
 */
const getProductLogs = async (req, res) => {
  try {
    const { id } = req.params;
    const TenantInventoryLog = req.db.model('InventoryLog', InventoryLog.schema);
    const logs = await TenantInventoryLog.find({ productId: id })
      .sort({ createdAt: -1 })
      .limit(200);
    return success(res, { logs });
  } catch (err) {
    console.error('[InventoryController] getProductLogs error:', err.message);
    return error(res, 'Falha ao buscar histórico do produto.', 500);
  }
};

module.exports = {
  getInventory,
  addProduct,
  updateProduct,
  deleteProduct,
  getProductBySku,
  searchProducts,
  getInventoryLogs,
  getProductLogs,
};
