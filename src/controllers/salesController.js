const MonthlySales = require('../models/MonthlySales');
const { success, error } = require('../utils/apiResponse');

const getTenantMonthlySalesModel = (req) => req.db.model('MonthlySales', MonthlySales.schema);

const getMonthlySales = async (req, res) => {
  try {
    const { year = new Date().getFullYear() } = req.query;

    const TenantMonthlySales = getTenantMonthlySalesModel(req);
    const sales = await TenantMonthlySales.find({ year: parseInt(year), isActive: true })
      .sort({ month: 1 });

    return success(res, { sales, year });
  } catch (err) {
    console.error('[SalesController] getMonthlySales error:', err.message);
    return error(res, 'Falha ao buscar vendas mensais.', 500);
  }
};

const addMonthlySales = async (req, res) => {
  try {
    const { month, year, revenue, unitsSold } = req.body;

    const TenantMonthlySales = getTenantMonthlySalesModel(req);

    const existing = await TenantMonthlySales.findOne({ month, year });
    if (existing) {
      return error(res, `Vendas para ${month}/${year} já existem.`, 409);
    }

    const sales = await TenantMonthlySales.create({
      month,
      year,
      revenue,
      unitsSold,
    });

    return success(res, { sales }, 201);
  } catch (err) {
    console.error('[SalesController] addMonthlySales error:', err.message);
    return error(res, err.message || 'Falha ao criar vendas mensais.', 400);
  }
};

const updateMonthlySales = async (req, res) => {
  try {
    const { id } = req.params;
    const { revenue, unitsSold } = req.body;

    const TenantMonthlySales = getTenantMonthlySalesModel(req);
    const sales = await TenantMonthlySales.findById(id);
    if (!sales) return error(res, 'Vendas não encontradas.', 404);

    if (revenue !== undefined) sales.revenue = revenue;
    if (unitsSold !== undefined) sales.unitsSold = unitsSold;

    await sales.save();

    return success(res, { sales });
  } catch (err) {
    console.error('[SalesController] updateMonthlySales error:', err.message);
    return error(res, err.message || 'Falha ao atualizar vendas mensais.', 400);
  }
};

module.exports = { getMonthlySales, addMonthlySales, updateMonthlySales };
