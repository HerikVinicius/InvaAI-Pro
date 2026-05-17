const Product = require('../models/Product');
const Salesperson = require('../models/Salesperson');
const Sale = require('../models/Sale');
const { success, error } = require('../utils/apiResponse');

const parseDateRange = (req) => {
  const { from, to } = req.query;
  if (!from || !to) return null;
  const fromDate = new Date(from);
  const toDate = new Date(to);
  if (isNaN(fromDate) || isNaN(toDate) || fromDate > toDate) return null;
  return { from: fromDate, to: toDate };
};

const getDashboardSummary = async (req, res) => {
  try {
    const TenantProduct = req.db.model('Product', Product.schema);
    const TenantSalesperson = req.db.model('Salesperson', Salesperson.schema);
    const TenantSale = req.db.model('Sale', Sale.schema);

    const now = new Date();
    const range = parseDateRange(req);

    // Período "atual": range customizado ou mês corrente.
    const periodoFrom = range ? range.from : new Date(now.getFullYear(), now.getMonth(), 1);
    const periodoTo   = range ? range.to   : now;

    // Período anterior: mesmo intervalo de duração imediatamente antes.
    const ms = periodoTo.getTime() - periodoFrom.getTime();
    const anteriorTo   = new Date(periodoFrom.getTime() - 1);
    const anteriorFrom = new Date(anteriorTo.getTime() - ms);

    const isLojista = req.user?.role === 'lojista';

    const baseQueries = [
      TenantProduct.countDocuments({ isActive: true }),
      TenantProduct.countDocuments({ status: 'CRITICAL', isActive: true }),
      TenantProduct.countDocuments({ status: 'LOW_STOCK', isActive: true }),
      TenantSalesperson.countDocuments({}),
      TenantSalesperson.countDocuments({ isActive: true }),
      TenantProduct.aggregate([
        { $match: { isActive: true } },
        { $group: { _id: null, total: { $sum: { $multiply: ['$quantity', '$price'] } } } },
      ]),
      // Período atual (filtrado)
      TenantSale.aggregate([
        { $match: { status: 'CONCLUIDA', createdAt: { $gte: periodoFrom, $lte: periodoTo } } },
        { $group: { _id: null, receita: { $sum: '$totalAmount' }, unidades: { $sum: { $sum: '$items.quantity' } }, vendas: { $sum: 1 } } },
      ]),
      // Período anterior (comparação)
      TenantSale.aggregate([
        { $match: { status: 'CONCLUIDA', createdAt: { $gte: anteriorFrom, $lte: anteriorTo } } },
        { $group: { _id: null, receita: { $sum: '$totalAmount' }, unidades: { $sum: { $sum: '$items.quantity' } }, vendas: { $sum: 1 } } },
      ]),
      // Top vendedor no período selecionado
      TenantSale.aggregate([
        { $match: { status: 'CONCLUIDA', createdAt: { $gte: periodoFrom, $lte: periodoTo } } },
        { $group: { _id: '$vendorId', vendorName: { $first: '$vendorName' }, totalVendido: { $sum: '$totalAmount' }, quantidadeVendas: { $sum: 1 } } },
        { $sort: { totalVendido: -1 } },
        { $limit: 1 },
      ]),
    ];

    const profitQuery = isLojista
      ? TenantSale.aggregate([
          { $match: { status: 'CONCLUIDA', createdAt: { $gte: periodoFrom, $lte: periodoTo } } },
          { $unwind: '$items' },
          {
            $lookup: {
              from: TenantProduct.collection.name,
              localField: 'items.sku',
              foreignField: 'sku',
              as: 'productInfo',
              pipeline: [{ $project: { purchasePrice: 1 } }],
            },
          },
          {
            $group: {
              _id: null,
              faturamento: { $sum: '$items.total' },
              custoTotal: {
                $sum: {
                  $multiply: [
                    '$items.quantity',
                    { $ifNull: [{ $arrayElemAt: ['$productInfo.purchasePrice', 0] }, 0] },
                  ],
                },
              },
            },
          },
          {
            $project: {
              _id: 0,
              faturamento: 1,
              custoTotal: 1,
              lucroLiquido: { $subtract: ['$faturamento', '$custoTotal'] },
              margemLucro: {
                $cond: [
                  { $gt: ['$faturamento', 0] },
                  { $multiply: [{ $divide: [{ $subtract: ['$faturamento', '$custoTotal'] }, '$faturamento'] }, 100] },
                  0,
                ],
              },
            },
          },
        ])
      : Promise.resolve(null);

    const [
      totalProducts,
      criticalCount,
      lowStockCount,
      totalSalespersons,
      activeSalespersons,
      inventoryValue,
      vendasAtual,
      vendasAnterior,
      topRanking,
      profitResult,
    ] = await Promise.all([...baseQueries, profitQuery]);

    const totalInventoryValue = inventoryValue[0]?.total ?? 0;
    const atual   = vendasAtual[0]   || { receita: 0, unidades: 0, vendas: 0 };
    const passado = vendasAnterior[0] || { receita: 0, unidades: 0, vendas: 0 };

    const variacaoReceita  = passado.receita  > 0 ? ((atual.receita  - passado.receita)  / passado.receita)  * 100 : (atual.receita  > 0 ? 100 : 0);
    const variacaoUnidades = passado.unidades > 0 ? ((atual.unidades - passado.unidades) / passado.unidades) * 100 : (atual.unidades > 0 ? 100 : 0);

    let topPerformer = null;
    if (topRanking[0]) {
      const sp = await TenantSalesperson.findOne({ $or: [{ _id: topRanking[0]._id }, { userId: topRanking[0]._id }] });
      topPerformer = {
        name: topRanking[0].vendorName,
        jobTitle: sp?.jobTitle || '',
        totalVendido: topRanking[0].totalVendido,
        quantidadeVendas: topRanking[0].quantidadeVendas,
        achievementPercentage: sp?.achievementPercentage || 0,
      };
    }

    const responsePayload = {
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
        receitaTotal: atual.receita,
        unidadesTotais: atual.unidades,
        quantidadeVendasTotal: atual.vendas,
        receitaMesAtual: atual.receita,
        unidadesMesAtual: atual.unidades,
        quantidadeVendasMesAtual: atual.vendas,
        variacaoReceita: Number(variacaoReceita.toFixed(1)),
        variacaoUnidades: Number(variacaoUnidades.toFixed(1)),
      },
      range: range
        ? { from: periodoFrom.toISOString().slice(0, 10), to: periodoTo.toISOString().slice(0, 10) }
        : null,
    };

    if (isLojista && profitResult?.[0]) {
      const p = profitResult[0];
      responsePayload.profitDashboard = {
        faturamento:  Number((p.faturamento  || 0).toFixed(2)),
        custoTotal:   Number((p.custoTotal   || 0).toFixed(2)),
        lucroLiquido: Number((p.lucroLiquido || 0).toFixed(2)),
        margemLucro:  Number((p.margemLucro  || 0).toFixed(1)),
      };
    }

    return success(res, responsePayload);
  } catch (err) {
    console.error('[DashboardController] getDashboardSummary error:', err.message);
    return error(res, 'Failed to fetch dashboard summary.', 500);
  }
};

module.exports = { getDashboardSummary };
