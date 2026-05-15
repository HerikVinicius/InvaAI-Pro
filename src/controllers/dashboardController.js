const Product = require('../models/Product');
const Salesperson = require('../models/Salesperson');
const Sale = require('../models/Sale');
const { success, error } = require('../utils/apiResponse');

const getDashboardSummary = async (req, res) => {
  try {
    const TenantProduct = req.db.model('Product', Product.schema);
    const TenantSalesperson = req.db.model('Salesperson', Salesperson.schema);
    const TenantSale = req.db.model('Sale', Sale.schema);

    const now = new Date();
    const inicioMes = new Date(now.getFullYear(), now.getMonth(), 1);
    const inicioMesPassado = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const fimMesPassado = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

    const [
      totalProducts,
      criticalCount,
      lowStockCount,
      totalSalespersons,
      activeSalespersons,
      inventoryValue,
      vendasMesAtual,
      vendasMesPassado,
      vendasTotais,
      topRanking,
    ] = await Promise.all([
      TenantProduct.countDocuments({ isActive: true }),
      TenantProduct.countDocuments({ status: 'CRITICAL', isActive: true }),
      TenantProduct.countDocuments({ status: 'LOW_STOCK', isActive: true }),
      TenantSalesperson.countDocuments({}),
      TenantSalesperson.countDocuments({ isActive: true }),
      TenantProduct.aggregate([
        { $match: { isActive: true } },
        { $group: { _id: null, total: { $sum: { $multiply: ['$quantity', '$price'] } } } },
      ]),
      TenantSale.aggregate([
        { $match: { status: 'CONCLUIDA', createdAt: { $gte: inicioMes } } },
        {
          $group: {
            _id: null,
            receita: { $sum: '$totalAmount' },
            unidades: { $sum: { $sum: '$items.quantity' } },
            vendas: { $sum: 1 },
          },
        },
      ]),
      TenantSale.aggregate([
        { $match: { status: 'CONCLUIDA', createdAt: { $gte: inicioMesPassado, $lte: fimMesPassado } } },
        {
          $group: {
            _id: null,
            receita: { $sum: '$totalAmount' },
            unidades: { $sum: { $sum: '$items.quantity' } },
            vendas: { $sum: 1 },
          },
        },
      ]),
      TenantSale.aggregate([
        { $match: { status: 'CONCLUIDA' } },
        {
          $group: {
            _id: null,
            receita: { $sum: '$totalAmount' },
            unidades: { $sum: { $sum: '$items.quantity' } },
            vendas: { $sum: 1 },
          },
        },
      ]),
      TenantSale.aggregate([
        { $match: { status: 'CONCLUIDA' } },
        {
          $group: {
            _id: '$vendorId',
            vendorName: { $first: '$vendorName' },
            totalVendido: { $sum: '$totalAmount' },
            quantidadeVendas: { $sum: 1 },
          },
        },
        { $sort: { totalVendido: -1 } },
        { $limit: 1 },
      ]),
    ]);

    const totalInventoryValue = inventoryValue[0]?.total ?? 0;
    const atual = vendasMesAtual[0] || { receita: 0, unidades: 0, vendas: 0 };
    const passado = vendasMesPassado[0] || { receita: 0, unidades: 0, vendas: 0 };
    const total = vendasTotais[0] || { receita: 0, unidades: 0, vendas: 0 };

    const variacaoReceita = passado.receita > 0
      ? ((atual.receita - passado.receita) / passado.receita) * 100
      : (atual.receita > 0 ? 100 : 0);
    const variacaoUnidades = passado.unidades > 0
      ? ((atual.unidades - passado.unidades) / passado.unidades) * 100
      : (atual.unidades > 0 ? 100 : 0);

    let topPerformer = null;
    if (topRanking[0]) {
      const sp = await TenantSalesperson.findById(topRanking[0]._id);
      topPerformer = {
        name: topRanking[0].vendorName,
        jobTitle: sp?.jobTitle || '',
        totalVendido: topRanking[0].totalVendido,
        quantidadeVendas: topRanking[0].quantidadeVendas,
        achievementPercentage: sp?.achievementPercentage || 0,
      };
    }

    return success(res, {
      inventory: {
        totalSkuCount: totalProducts,
        criticalAlerts: criticalCount + lowStockCount,
        criticalCount,
        lowStockCount,
        totalInventoryValue,
      },
      salesTeam: {
        totalSalespersons,
        activeSalespersons,
        inactiveSalespersons: totalSalespersons - activeSalespersons,
        topPerformer,
      },
      sales: {
        receitaTotal: total.receita,
        unidadesTotais: total.unidades,
        quantidadeVendasTotal: total.vendas,
        receitaMesAtual: atual.receita,
        unidadesMesAtual: atual.unidades,
        quantidadeVendasMesAtual: atual.vendas,
        variacaoReceita: Number(variacaoReceita.toFixed(1)),
        variacaoUnidades: Number(variacaoUnidades.toFixed(1)),
      },
    });
  } catch (err) {
    console.error('[DashboardController] getDashboardSummary error:', err.message);
    return error(res, 'Failed to fetch dashboard summary.', 500);
  }
};

module.exports = { getDashboardSummary };
