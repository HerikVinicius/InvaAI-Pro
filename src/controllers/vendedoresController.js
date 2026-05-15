const Salesperson = require('../models/Salesperson');
const { success, error } = require('../utils/apiResponse');

const VALID_JOBTITLES = ['Vendedor', 'Gerente'];

const getTenantSalespersonModel = (req) => req.db.model('Salesperson', Salesperson.schema);

const getVendedores = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 10));
    const skip = (page - 1) * limit;

    const filter = {};
    if (req.query.status === 'active') filter.isActive = true;
    if (req.query.status === 'inactive') filter.isActive = false;
    if (req.query.search) {
      filter.name = new RegExp(req.query.search, 'i');
    }

    const TenantSalesperson = getTenantSalespersonModel(req);
    const [vendedores, total] = await Promise.all([
      TenantSalesperson.find(filter).skip(skip).limit(limit).sort({ salesRealized: -1 }),
      TenantSalesperson.countDocuments(filter),
    ]);

    return success(res, {
      vendedores,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    console.error('[VendedoresController] getVendedores error:', err.message);
    return error(res, 'Failed to fetch vendedores.', 500);
  }
};

/**
 * POST /vendedores — creates a Salesperson record WITHOUT a login account.
 *
 * NOTE: This is the legacy path used for "vendedores de venda apenas"
 * (a Salesperson that exists for sales-tracking but doesn't log in).
 * The full vendedor flow (User+Salesperson) goes through POST /users
 * with role=vendedor, which is what the Vendedores page UI now calls.
 */
const createVendedor = async (req, res) => {
  try {
    const { name, phone, jobTitle, warehouseUnit, salesTarget } = req.body;

    if (!name || !name.trim()) {
      return error(res, 'Nome do vendedor é obrigatório.', 400);
    }

    const TenantSalesperson = getTenantSalespersonModel(req);

    const vendedor = await TenantSalesperson.create({
      name: name.trim(),
      phone, jobTitle, warehouseUnit, salesTarget,
    });

    return success(res, { vendedor }, 201);
  } catch (err) {
    console.error('[VendedoresController] createVendedor error:', err.message);
    return error(res, err.message || 'Falha ao criar vendedor.', 400);
  }
};

const updateVendedor = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, jobTitle, warehouseUnit, salesTarget, salesRealized, isActive } = req.body;

    if (jobTitle !== undefined && !VALID_JOBTITLES.includes(jobTitle)) {
      return error(res, 'Cargo inválido. Use Vendedor ou Gerente.', 400);
    }

    const TenantSalesperson = getTenantSalespersonModel(req);
    const vendedor = await TenantSalesperson.findById(id);
    if (!vendedor) return error(res, 'Vendedor não encontrado.', 404);

    if (name !== undefined) vendedor.name = name;
    if (jobTitle !== undefined) vendedor.jobTitle = jobTitle;
    if (warehouseUnit !== undefined) vendedor.warehouseUnit = warehouseUnit;
    if (salesTarget !== undefined) vendedor.salesTarget = salesTarget;
    if (salesRealized !== undefined) vendedor.salesRealized = salesRealized;
    if (isActive !== undefined) vendedor.isActive = isActive;

    await vendedor.save();

    return success(res, { vendedor });
  } catch (err) {
    console.error('[VendedoresController] updateVendedor error:', err.message);
    return error(res, err.message || 'Falha ao atualizar vendedor.', 400);
  }
};

const deleteVendedor = async (req, res) => {
  try {
    const { id } = req.params;

    const TenantSalesperson = getTenantSalespersonModel(req);
    const vendedor = await TenantSalesperson.findById(id);
    if (!vendedor) return error(res, 'Vendedor não encontrado.', 404);

    await TenantSalesperson.findByIdAndDelete(id);

    return success(res, { message: 'Vendedor deletado.' });
  } catch (err) {
    console.error('[VendedoresController] deleteVendedor error:', err.message);
    return error(res, err.message || 'Falha ao deletar vendedor.', 400);
  }
};

module.exports = { getVendedores, createVendedor, updateVendedor, deleteVendedor };
