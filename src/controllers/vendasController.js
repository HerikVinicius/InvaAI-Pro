const mongoose = require('mongoose');
const Sale = require('../models/Sale');
const Product = require('../models/Product');
const Salesperson = require('../models/Salesperson');
const Caixa = require('../models/Caixa');
const CashTransaction = require('../models/CashTransaction');
const Cliente = require('../models/Cliente');
const InventoryLog = require('../models/InventoryLog');
const { success, error } = require('../utils/apiResponse');
const { createNotification } = require('./notificationsController');
const { logInventoryChange } = require('../utils/logInventoryChange');

const getModels = (req) => ({
  Sale: req.db.model('Sale', Sale.schema),
  Product: req.db.model('Product', Product.schema),
  Salesperson: req.db.model('Salesperson', Salesperson.schema),
  Caixa: req.db.model('Caixa', Caixa.schema),
  CashTransaction: req.db.model('CashTransaction', CashTransaction.schema),
  Cliente: req.db.model('Cliente', Cliente.schema),
});

// Hard cap on how far back a vendedor is allowed to query their sales.
const VENDOR_MAX_RANGE_DAYS = 30;

const isVendedor = (req) => req.user?.role === 'vendedor';

/**
 * Returns the Salesperson._id for the currently logged-in vendedor (via the
 * userId link set at user-creation time). Returns null if no link exists
 * (legacy vendedor not yet provisioned).
 */
const getVendorSalespersonId = async (req) => {
  const { Salesperson: TenantSalesperson } = getModels(req);
  const sp = await TenantSalesperson.findOne({ userId: req.user.id }).select('_id');
  return sp ? sp._id.toString() : null;
};

/**
 * Returns a `createdAt` window for the vendedor: at most VENDOR_MAX_RANGE_DAYS
 * back from "to" (default now). Caller can pass `from`/`to` query params.
 */
const buildVendorDateRange = (req) => {
  const now = new Date();
  const requestedTo = req.query.to ? new Date(req.query.to) : now;
  const requestedFrom = req.query.from ? new Date(req.query.from) : null;

  const earliestAllowed = new Date(requestedTo.getTime() - VENDOR_MAX_RANGE_DAYS * 24 * 60 * 60 * 1000);

  // If user asked for older than 30 days back, clamp to the limit.
  const from = requestedFrom && requestedFrom > earliestAllowed ? requestedFrom : earliestAllowed;

  return { from, to: requestedTo };
};

// Parses ?from=YYYY-MM-DD&to=YYYY-MM-DD into a { from, to } pair of Date objects.
// `to` is set to the end of the given day so the range is inclusive.
// Returns null when either side is missing or invalid.
const parseDateRange = (req) => {
  const { from, to } = req.query;
  if (!from || !to) return null;
  const fromDate = new Date(from);
  const toDate = new Date(`${to}T23:59:59.999`);
  if (isNaN(fromDate) || isNaN(toDate) || fromDate > toDate) return null;
  return { from: fromDate, to: toDate };
};

// Sum of all non-FIADO payment slices — what actually enters the caixa.
const computeCashPortion = (paymentMethod, totalAmount, payments) => {
  if (Array.isArray(payments) && payments.length >= 2) {
    return payments
      .filter((p) => p.method !== 'FIADO')
      .reduce((s, p) => s + (p.amount || 0), 0);
  }
  return paymentMethod === 'FIADO' ? 0 : totalAmount;
};

const computeFiadoPortion = (paymentMethod, totalAmount, payments) => {
  if (Array.isArray(payments) && payments.length >= 2) {
    return payments
      .filter((p) => p.method === 'FIADO')
      .reduce((s, p) => s + (p.amount || 0), 0);
  }
  return paymentMethod === 'FIADO' ? totalAmount : 0;
};

/**
 * Computes item total applying its own discount.
 * Returns { itemTotal, discountAmount }.
 */
const applyItemDiscount = (unitPrice, quantity, discount = 0, discountType = 'percentage') => {
  const gross = unitPrice * quantity;
  if (!discount || discount <= 0) return { itemTotal: gross, discountAmount: 0 };
  const discountAmount = discountType === 'fixed'
    ? Math.min(discount, gross)
    : gross * (Math.min(discount, 100) / 100);
  return { itemTotal: Math.max(0, gross - discountAmount), discountAmount };
};

/**
 * Computes global discount applied on the subtotal (sum of item totals after item discounts).
 */
const applyGlobalDiscount = (subtotal, globalDiscount = 0, globalDiscountType = 'percentage') => {
  if (!globalDiscount || globalDiscount <= 0) return { finalTotal: subtotal, globalDiscountAmount: 0 };
  const globalDiscountAmount = globalDiscountType === 'fixed'
    ? Math.min(globalDiscount, subtotal)
    : subtotal * (Math.min(globalDiscount, 100) / 100);
  return { finalTotal: Math.max(0, subtotal - globalDiscountAmount), globalDiscountAmount };
};

const criarVenda = async (req, res) => {
  try {
    const {
      vendorId,
      vendorName,
      items,
      paymentMethod,
      installments,
      payments,
      clienteId,
      clienteName,
      globalDiscount = 0,
      globalDiscountType = 'percentage',
    } = req.body;

    // Recompute totals server-side — never trust client totalAmount.
    const itemsWithTotals = (items || []).map((item) => {
      const { itemTotal } = applyItemDiscount(
        item.unitPrice,
        item.quantity,
        item.discount || 0,
        item.discountType || 'percentage'
      );
      return { ...item, total: itemTotal };
    });

    const subtotal = itemsWithTotals.reduce((s, i) => s + i.total, 0);
    const { finalTotal } = applyGlobalDiscount(subtotal, globalDiscount, globalDiscountType);
    const totalAmount = Math.round(finalTotal * 100) / 100;

    const isSplit = Array.isArray(payments) && payments.length >= 2;

    if (!vendorId || !itemsWithTotals?.length || !totalAmount) {
      return error(res, 'Dados da venda incompletos.', 400);
    }
    if (!isSplit && !paymentMethod) {
      return error(res, 'Informe o método de pagamento.', 400);
    }
    if (isSplit) {
      const soma = payments.reduce((s, p) => s + (p.amount || 0), 0);
      if (Math.abs(soma - totalAmount) > 0.01) {
        return error(res, `Soma dos pagamentos (R$ ${soma.toFixed(2)}) difere do total (R$ ${totalAmount.toFixed(2)}).`, 400);
      }
    }

    const fiadoAmount = computeFiadoPortion(paymentMethod, totalAmount, payments);
    const cashAmount = computeCashPortion(paymentMethod, totalAmount, payments);

    if (fiadoAmount > 0 && !clienteId) {
      return error(res, 'Cliente é obrigatório para vendas com FIADO.', 400);
    }

    const {
      Sale: TenantSale,
      Product: TenantProduct,
      Salesperson: TenantSalesperson,
      Caixa: TenantCaixa,
      CashTransaction: TenantTx,
      Cliente: TenantCliente,
    } = getModels(req);

    // 1. Caixa must be open
    const caixaAberto = await TenantCaixa.findOne({ status: 'ABERTO' });
    if (!caixaAberto) {
      return error(res, 'Nenhum caixa aberto. Abra um caixa antes de registrar vendas.', 409);
    }

    // Trava de segurança 24h: impede novas vendas se o caixa não foi fechado no prazo.
    const horasAberto = (Date.now() - new Date(caixaAberto.openedAt).getTime()) / (1000 * 60 * 60);
    if (horasAberto >= 24) {
      return error(res, {
        code: 'CAIXA_EXPIRED',
        message: 'O caixa está aberto há mais de 24 horas. Realize a Batida de Caixa (fechamento) antes de registrar novas vendas.',
        pendingCaixa: {
          _id: caixaAberto._id,
          openedAt: caixaAberto.openedAt,
          openedByName: caixaAberto.openedByName,
          horasAberto: Math.floor(horasAberto),
        },
      }, 409);
    }

    // 2. Vendedor lookup
    let vendedor;
    try {
      vendedor = await TenantSalesperson.findById(vendorId);
    } catch (e) {
      return error(res, `vendorId inválido: ${vendorId}`, 400);
    }
    if (!vendedor) return error(res, `Vendedor ${vendorId} não encontrado neste tenant.`, 404);
    if (!vendedor.isActive) return error(res, 'Vendedor está inativo.', 400);

    // 3. Cliente lookup (when fiado)
    let cliente = null;
    if (clienteId) {
      cliente = await TenantCliente.findById(clienteId);
      if (!cliente) return error(res, 'Cliente não encontrado.', 404);
    }

    // 4. Stock validation
    const skus = itemsWithTotals.map((i) => i.sku).filter(Boolean);
    const produtos = await TenantProduct.find({ sku: { $in: skus }, isActive: true });
    const produtosBySku = Object.fromEntries(produtos.map((p) => [p.sku, p]));

    for (const item of itemsWithTotals) {
      const produto = produtosBySku[item.sku];
      if (!produto) return error(res, `Produto ${item.sku} não encontrado no estoque.`, 404);
      if (produto.quantity < item.quantity) {
        return error(res, `Estoque insuficiente para ${produto.name} (disponível: ${produto.quantity}, pedido: ${item.quantity}).`, 400);
      }
    }

    // 5. Persist sale
    const vendaData = {
      vendorId,
      vendorName: vendorName || vendedor.name,
      items: itemsWithTotals,
      subtotal,
      globalDiscount,
      globalDiscountType,
      totalAmount,
      paymentMethod: isSplit ? 'SPLIT' : paymentMethod,
      installments: (!isSplit && paymentMethod === 'CREDITO') ? (installments || 1) : 1,
      caixaId: caixaAberto._id,
      clienteId: cliente?._id,
      clienteName: cliente?.name || clienteName,
    };
    if (isSplit) vendaData.payments = payments;

    const venda = await TenantSale.create(vendaData);

    // 6. Stock decrement + low-stock notifications + audit log
    await Promise.all(
      itemsWithTotals.map(async (item) => {
        const produto = produtosBySku[item.sku];
        const before = produto.quantity;
        produto.quantity = Math.max(0, produto.quantity - item.quantity);
        await produto.save();

        await logInventoryChange(req, {
          product: produto,
          action: 'SALE',
          quantityBefore: before,
          quantityAfter: produto.quantity,
          delta: produto.quantity - before,
          saleId: venda._id,
        });

        if (produto.quantity <= produto.lowStockThreshold) {
          const notificationType = produto.quantity === 0 ? 'CRITICAL_STOCK' : 'LOW_STOCK';
          const message = produto.quantity === 0
            ? `${produto.name} está fora de estoque!`
            : `${produto.name} chegou ao limite baixo (${produto.quantity}/${produto.lowStockThreshold})`;

          await createNotification(req.db, {
            productId: produto._id.toString(),
            productName: produto.name,
            sku: produto.sku,
            currentQuantity: produto.quantity,
            lowStockThreshold: produto.lowStockThreshold,
            type: notificationType,
            message,
          });
        }
      })
    );

    // 7. Cash transaction(s): one per non-FIADO slice so each fragment carries
    //    its own paymentMethod + saleId. This is what makes split payments
    //    fully traceable when a sale is cancelled/refunded — every fragment
    //    can be matched back to the same Sale via saleId.
    if (cashAmount > 0) {
      if (isSplit) {
        for (const slice of payments.filter((p) => p.method !== 'FIADO')) {
          await TenantTx.create({
            caixaId: caixaAberto._id,
            type: 'VENDA',
            amount: slice.amount,
            paymentMethod: slice.method,
            saleId: venda._id,
            clienteId: cliente?._id,
            createdBy: req.user.id,
            createdByName: req.user.name || req.user.username,
          });
        }
      } else {
        await TenantTx.create({
          caixaId: caixaAberto._id,
          type: 'VENDA',
          amount: cashAmount,
          paymentMethod,
          saleId: venda._id,
          clienteId: cliente?._id,
          createdBy: req.user.id,
          createdByName: req.user.name || req.user.username,
        });
      }
    }

    // 8. Cliente debt increase (fiado portion)
    if (fiadoAmount > 0 && cliente) {
      cliente.saldoDevedor = (cliente.saldoDevedor || 0) + fiadoAmount;
      await cliente.save();
    }

    // 9. Vendedor commissioned total
    await TenantSalesperson.findByIdAndUpdate(vendorId, {
      $inc: { salesRealized: totalAmount },
    });

    console.log(`[VendasController] Venda ${venda._id} criada: R$ ${totalAmount} (cash R$ ${cashAmount.toFixed(2)} / fiado R$ ${fiadoAmount.toFixed(2)})`);
    return success(res, { venda }, 201);
  } catch (err) {
    console.error('[VendasController] criarVenda error:', err);
    return error(res, err.message || 'Falha ao registrar venda.', 400);
  }
};

/**
 * POST /vendas/:id/cancel — cancels a sale.
 *
 * Rules (per spec):
 *  - Caixa onde a venda foi registrada precisa ainda estar 'ABERTO'.
 *  - Body precisa conter `reason`.
 *  - Operação é atômica (MongoDB Transaction):
 *      1. Venda → status 'CANCELADA' + motivo + cancelledAt + cancelledBy
 *      2. Estoque é devolvido (incremento item a item)
 *      3. Se houve fiado, saldoDevedor do cliente é decrementado
 *      4. CashTransaction tipo 'ESTORNO' com descrição "Estorno Venda [ID]: [Motivo]"
 */
const cancelarVenda = async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;

  if (!reason || !reason.trim()) {
    return error(res, 'Motivo do cancelamento é obrigatório.', 400);
  }

  const {
    Sale: TenantSale,
    Product: TenantProduct,
    Caixa: TenantCaixa,
    CashTransaction: TenantTx,
    Cliente: TenantCliente,
    Salesperson: TenantSalesperson,
  } = getModels(req);

  // Pre-flight checks BEFORE opening the transaction so we fail fast.
  const venda = await TenantSale.findById(id);
  if (!venda) return error(res, 'Venda não encontrada.', 404);
  if (venda.status === 'CANCELADA') return error(res, 'Venda já está cancelada.', 409);

  if (!venda.caixaId) {
    return error(res, 'Venda não está vinculada a um caixa (venda legada). Cancelamento bloqueado.', 422);
  }
  const caixa = await TenantCaixa.findById(venda.caixaId);
  if (!caixa) return error(res, 'Caixa da venda não encontrado.', 404);
  if (caixa.status !== 'ABERTO') {
    return error(res, 'O caixa da venda já foi fechado. Cancelamento bloqueado.', 409);
  }

  const session = await req.db.startSession();

  try {
    await session.withTransaction(async () => {
      // 1. Mark sale cancelled
      venda.status = 'CANCELADA';
      venda.cancelReason = reason.trim();
      venda.cancelledAt = new Date();
      venda.cancelledBy = req.user.id;
      venda.cancelledByName = req.user.name || req.user.username;
      await venda.save({ session });

      // 2. Return stock for every item + audit log
      for (const item of venda.items) {
        const produto = await TenantProduct.findOne({ sku: item.sku }).session(session);
        if (!produto) continue; // produto pode ter sido deletado depois da venda
        const before = produto.quantity;
        produto.quantity = before + item.quantity;
        await produto.save({ session });

        await logInventoryChange(req, {
          product: produto,
          action: 'CANCEL_RESTORE',
          quantityBefore: before,
          quantityAfter: produto.quantity,
          delta: item.quantity,
          saleId: venda._id,
          reason: reason.trim(),
          session,
        });
      }

      // 3. Reverse fiado (if any) on the customer's balance
      const fiadoAmount = computeFiadoPortion(
        venda.paymentMethod,
        venda.totalAmount,
        venda.payments
      );
      if (fiadoAmount > 0 && venda.clienteId) {
        await TenantCliente.updateOne(
          { _id: venda.clienteId },
          { $inc: { saldoDevedor: -fiadoAmount } },
          { session }
        );
      }

      // 4. Cash refund transaction(s): mirror the original VENDA fragments
      //    so each estorno carries the same paymentMethod + saleId. This is
      //    what gives audit-trail symmetry for split payments — every fragment
      //    of the original sale has a matching reversal.
      const vendaTxs = await TenantTx
        .find({ saleId: venda._id, type: 'VENDA' })
        .session(session);

      if (vendaTxs.length > 0) {
        for (const tx of vendaTxs) {
          const estorno = new TenantTx({
            caixaId: caixa._id,
            type: 'ESTORNO',
            amount: -Math.abs(tx.amount),
            description: `Estorno Venda ${venda._id}: ${reason.trim()}`,
            paymentMethod: tx.paymentMethod,
            saleId: venda._id,
            clienteId: venda.clienteId,
            createdBy: req.user.id,
            createdByName: req.user.name || req.user.username,
          });
          await estorno.save({ session });
        }
      } else {
        // Fallback for legacy sales that didn't write per-slice CashTransactions:
        // compute the cash portion from the Sale doc and create a single estorno.
        const cashAmount = computeCashPortion(
          venda.paymentMethod,
          venda.totalAmount,
          venda.payments
        );
        if (cashAmount > 0) {
          const estorno = new TenantTx({
            caixaId: caixa._id,
            type: 'ESTORNO',
            amount: -Math.abs(cashAmount),
            description: `Estorno Venda ${venda._id}: ${reason.trim()}`,
            paymentMethod: venda.paymentMethod,
            saleId: venda._id,
            clienteId: venda.clienteId,
            createdBy: req.user.id,
            createdByName: req.user.name || req.user.username,
          });
          await estorno.save({ session });
        }
      }

      // 5. Reverse vendedor's commissioned amount
      await TenantSalesperson.updateOne(
        { _id: venda.vendorId },
        { $inc: { salesRealized: -venda.totalAmount } },
        { session }
      );
    });

    return success(res, { venda: await TenantSale.findById(id) });
  } catch (err) {
    console.error('[VendasController] cancelarVenda transaction error:', err);
    return error(res, err.message || 'Falha ao cancelar venda.', 500);
  } finally {
    session.endSession();
  }
};

const getVendas = async (req, res) => {
  try {
    const { Sale: TenantSale } = getModels(req);
    const { vendorId, status, caixaId, clienteId, limit = 50, page = 1 } = req.query;

    const filter = {};
    if (status) filter.status = status;
    if (caixaId) filter.caixaId = caixaId;
    if (clienteId) filter.clienteId = clienteId;

    if (isVendedor(req)) {
      // Vendedor só vê as próprias vendas, com janela de no máximo 30 dias.
      const ownSalespersonId = await getVendorSalespersonId(req);
      if (!ownSalespersonId) {
        return success(res, { vendas: [], total: 0, scope: 'vendedor', warning: 'Conta de vendedor sem perfil vinculado. Procure o lojista.' });
      }
      filter.vendorId = ownSalespersonId;

      const { from, to } = buildVendorDateRange(req);
      filter.createdAt = { $gte: from, $lte: to };
    } else if (vendorId) {
      filter.vendorId = vendorId;
    }

    const skip = (page - 1) * limit;
    const [vendas, total] = await Promise.all([
      TenantSale.find(filter).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)),
      TenantSale.countDocuments(filter),
    ]);

    return success(res, { vendas, total, scope: isVendedor(req) ? 'vendedor' : 'all' });
  } catch (err) {
    console.error('[VendasController] getVendas error:', err.message);
    return error(res, 'Falha ao buscar vendas.', 500);
  }
};

const getTopVendedores = async (req, res) => {
  try {
    const { Sale: TenantSale } = getModels(req);

    // Lojista/admin/master enxergam o ranking completo.
    if (!isVendedor(req)) {
      const ranking = await TenantSale.aggregate([
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
        { $limit: 10 },
      ]);
      return success(res, { ranking, scope: 'full' });
    }

    // Vendedor: mostramos APENAS a própria posição + quantidade. Sem valores monetários.
    const ownSalespersonId = await getVendorSalespersonId(req);
    if (!ownSalespersonId) {
      return success(res, { ranking: [], position: null, totalVendedores: 0, scope: 'vendedor' });
    }

    // Aggregate só com quantidadeVendas — não retornamos receita pra ninguém.
    const allRanked = await TenantSale.aggregate([
      { $match: { status: 'CONCLUIDA' } },
      {
        $group: {
          _id: '$vendorId',
          vendorName: { $first: '$vendorName' },
          quantidadeVendas: { $sum: 1 },
        },
      },
      { $sort: { quantidadeVendas: -1 } },
    ]);

    const position = allRanked.findIndex((r) => r._id?.toString() === ownSalespersonId);
    const me = position >= 0 ? allRanked[position] : null;

    return success(res, {
      ranking: me ? [me] : [],
      position: position >= 0 ? position + 1 : null,
      totalVendedores: allRanked.length,
      scope: 'vendedor',
    });
  } catch (err) {
    console.error('[VendasController] getTopVendedores error:', err.message);
    return error(res, 'Falha ao buscar ranking.', 500);
  }
};

const getProdutosMaisVendidosPorVendedor = async (req, res) => {
  try {
    const { vendorId } = req.params;
    const { Sale: TenantSale } = getModels(req);

    // Vendedor só pode consultar a si mesmo.
    if (isVendedor(req)) {
      const ownSalespersonId = await getVendorSalespersonId(req);
      if (!ownSalespersonId || vendorId !== ownSalespersonId) {
        return error(res, 'Acesso negado. Vendedor só pode ver os próprios produtos.', 403);
      }
    }

    const pipeline = [
      { $match: { vendorId, status: 'CONCLUIDA' } },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.sku',
          name: { $first: '$items.name' },
          totalQuantidade: { $sum: '$items.quantity' },
          ...(isVendedor(req) ? {} : { totalValor: { $sum: '$items.total' } }),
        },
      },
      { $sort: { totalQuantidade: -1 } },
      { $limit: 10 },
    ];
    const produtos = await TenantSale.aggregate(pipeline);

    return success(res, { produtos });
  } catch (err) {
    console.error('[VendasController] getProdutosMaisVendidos error:', err.message);
    return error(res, 'Falha ao buscar produtos.', 500);
  }
};

const getStats = async (req, res) => {
  try {
    const { Sale: TenantSale } = getModels(req);
    const range = parseDateRange(req);

    // Cumulative "total" doesn't depend on the range — it's the lifetime total.
    const totalGeralPromise = TenantSale.aggregate([
      { $match: { status: 'CONCLUIDA' } },
      { $group: { _id: null, receita: { $sum: '$totalAmount' }, unidades: { $sum: { $sum: '$items.quantity' } }, quantidadeVendas: { $sum: 1 } } },
    ]);

    let periodoAtual, periodoAnterior, atualLabel, anteriorLabel;

    if (range) {
      // Custom range — previous period is the same duration immediately before.
      const ms = range.to.getTime() - range.from.getTime();
      const prevTo = new Date(range.from.getTime() - 1);
      const prevFrom = new Date(prevTo.getTime() - ms);

      periodoAtual = TenantSale.aggregate([
        { $match: { status: 'CONCLUIDA', createdAt: { $gte: range.from, $lte: range.to } } },
        { $group: { _id: null, receita: { $sum: '$totalAmount' }, unidades: { $sum: { $sum: '$items.quantity' } }, quantidadeVendas: { $sum: 1 } } },
      ]);
      periodoAnterior = TenantSale.aggregate([
        { $match: { status: 'CONCLUIDA', createdAt: { $gte: prevFrom, $lte: prevTo } } },
        { $group: { _id: null, receita: { $sum: '$totalAmount' }, unidades: { $sum: { $sum: '$items.quantity' } }, quantidadeVendas: { $sum: 1 } } },
      ]);
      atualLabel = 'periodo';
      anteriorLabel = 'periodoAnterior';
    } else {
      // Default — month-over-month comparison.
      const now = new Date();
      const inicioMes = new Date(now.getFullYear(), now.getMonth(), 1);
      const inicioMesPassado = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const fimMesPassado = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

      periodoAtual = TenantSale.aggregate([
        { $match: { status: 'CONCLUIDA', createdAt: { $gte: inicioMes } } },
        { $group: { _id: null, receita: { $sum: '$totalAmount' }, unidades: { $sum: { $sum: '$items.quantity' } }, quantidadeVendas: { $sum: 1 } } },
      ]);
      periodoAnterior = TenantSale.aggregate([
        { $match: { status: 'CONCLUIDA', createdAt: { $gte: inicioMesPassado, $lte: fimMesPassado } } },
        { $group: { _id: null, receita: { $sum: '$totalAmount' }, unidades: { $sum: { $sum: '$items.quantity' } }, quantidadeVendas: { $sum: 1 } } },
      ]);
      atualLabel = 'mesAtual';
      anteriorLabel = 'mesPassado';
    }

    const [totalGeral, atualArr, anteriorArr] = await Promise.all([
      totalGeralPromise,
      periodoAtual,
      periodoAnterior,
    ]);

    const total = totalGeral[0] || { receita: 0, unidades: 0, quantidadeVendas: 0 };
    const atual = atualArr[0] || { receita: 0, unidades: 0, quantidadeVendas: 0 };
    const passado = anteriorArr[0] || { receita: 0, unidades: 0, quantidadeVendas: 0 };

    const variacaoReceita = passado.receita > 0
      ? ((atual.receita - passado.receita) / passado.receita) * 100
      : (atual.receita > 0 ? 100 : 0);
    const variacaoUnidades = passado.unidades > 0
      ? ((atual.unidades - passado.unidades) / passado.unidades) * 100
      : (atual.unidades > 0 ? 100 : 0);

    const ticketMedio = atual.quantidadeVendas > 0 ? atual.receita / atual.quantidadeVendas : 0;

    // Always return BOTH the legacy keys (mesAtual/mesPassado) AND the generic
    // keys (periodo/periodoAnterior) so existing dashboards keep working.
    const response = {
      total,
      [atualLabel]: atual,
      [anteriorLabel]: passado,
      mesAtual: range ? atual : atual,
      mesPassado: range ? passado : passado,
      variacaoReceita: Number(variacaoReceita.toFixed(1)),
      variacaoUnidades: Number(variacaoUnidades.toFixed(1)),
      ticketMedio: Number(ticketMedio.toFixed(2)),
      range: range ? { from: range.from.toISOString().slice(0, 10), to: range.to.toISOString().slice(0, 10) } : null,
    };

    return success(res, response);
  } catch (err) {
    console.error('[VendasController] getStats error:', err.message);
    return error(res, 'Falha ao buscar estatísticas.', 500);
  }
};

const getTrend = async (req, res) => {
  try {
    const { Sale: TenantSale } = getModels(req);
    const range = parseDateRange(req);
    const labelMeses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

    // Custom date range: pick the bucket size based on duration so the chart
    // stays readable. ≤31 days → daily, ≤90 → weekly, >90 → monthly.
    if (range) {
      const days = Math.ceil((range.to - range.from) / 86400000);
      const granularity = days <= 31 ? 'day' : days <= 90 ? 'week' : 'month';

      const groupId =
        granularity === 'day'
          ? { ano: { $year: '$createdAt' }, mes: { $month: '$createdAt' }, dia: { $dayOfMonth: '$createdAt' } }
          : granularity === 'week'
          ? { ano: { $isoWeekYear: '$createdAt' }, semana: { $isoWeek: '$createdAt' } }
          : { ano: { $year: '$createdAt' }, mes: { $month: '$createdAt' } };

      const dados = await TenantSale.aggregate([
        { $match: { status: 'CONCLUIDA', createdAt: { $gte: range.from, $lte: range.to } } },
        { $group: { _id: groupId, receita: { $sum: '$totalAmount' }, unidades: { $sum: { $sum: '$items.quantity' } } } },
        { $sort: { _id: 1 } },
      ]);

      const formatPoint = (id) => {
        if (granularity === 'day') {
          return `${String(id.dia).padStart(2, '0')}/${String(id.mes).padStart(2, '0')}`;
        }
        if (granularity === 'week') {
          return `S${id.semana}/${String(id.ano).slice(-2)}`;
        }
        return `${labelMeses[id.mes - 1]}/${String(id.ano).slice(-2)}`;
      };

      const trend = dados.map((d) => ({
        month: formatPoint(d._id),
        revenue: d.receita || 0,
        units: d.unidades || 0,
      }));

      return success(res, { trend, granularity, range: { from: range.from.toISOString().slice(0, 10), to: range.to.toISOString().slice(0, 10) } });
    }

    // Default (no range): last N months — kept for the dashboard.
    const meses = parseInt(req.query.meses) || 6;
    const now = new Date();
    const inicio = new Date(now.getFullYear(), now.getMonth() - (meses - 1), 1);

    const dados = await TenantSale.aggregate([
      { $match: { status: 'CONCLUIDA', createdAt: { $gte: inicio } } },
      { $group: { _id: { ano: { $year: '$createdAt' }, mes: { $month: '$createdAt' } }, receita: { $sum: '$totalAmount' }, unidades: { $sum: { $sum: '$items.quantity' } } } },
      { $sort: { '_id.ano': 1, '_id.mes': 1 } },
    ]);

    const trend = [];
    for (let i = meses - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const ano = d.getFullYear();
      const mes = d.getMonth() + 1;
      const found = dados.find((x) => x._id.ano === ano && x._id.mes === mes);
      trend.push({
        month: `${labelMeses[mes - 1]}/${String(ano).slice(-2)}`,
        revenue: found?.receita || 0,
        units: found?.unidades || 0,
      });
    }

    return success(res, { trend, granularity: 'month' });
  } catch (err) {
    console.error('[VendasController] getTrend error:', err.message);
    return error(res, 'Falha ao buscar tendência.', 500);
  }
};

const getPaymentBreakdown = async (req, res) => {
  try {
    const { Sale: TenantSale } = getModels(req);
    const range = parseDateRange(req);

    const match = { status: 'CONCLUIDA' };
    if (range) match.createdAt = { $gte: range.from, $lte: range.to };

    // Normalize: non-SPLIT → single row { method, amount }; SPLIT → one row per payments[] slice.
    const breakdown = await TenantSale.aggregate([
      { $match: match },
      {
        $addFields: {
          slices: {
            $cond: {
              if: { $eq: ['$paymentMethod', 'SPLIT'] },
              then: {
                $map: {
                  input: '$payments',
                  as: 'p',
                  in: { method: '$$p.method', amount: '$$p.amount' },
                },
              },
              else: [{ method: '$paymentMethod', amount: '$totalAmount' }],
            },
          },
        },
      },
      { $unwind: '$slices' },
      {
        $group: {
          _id: '$slices.method',
          receita: { $sum: '$slices.amount' },
          quantidade: { $sum: 1 },
        },
      },
      { $sort: { receita: -1 } },
    ]);

    return success(res, {
      breakdown,
      range: range ? { from: range.from.toISOString().slice(0, 10), to: range.to.toISOString().slice(0, 10) } : null,
    });
  } catch (err) {
    console.error('[VendasController] getPaymentBreakdown error:', err.message);
    return error(res, 'Falha ao buscar breakdown.', 500);
  }
};

const getReceiptData = async (req, res) => {
  try {
    const { id } = req.params;
    const { Sale: TenantSale, Salesperson: TenantSalesperson } = getModels(req);
    const TenantConfig = req.db.model('TenantConfig', require('../models/TenantConfig').schema);

    const venda = await TenantSale.findById(id);
    if (!venda) return error(res, 'Venda não encontrada.', 404);

    // Buscar dados do vendedor
    let vendedorNome = venda.vendorName;
    try {
      const vendedor = await TenantSalesperson.findById(venda.vendorId);
      if (vendedor) vendedorNome = vendedor.name;
    } catch (e) {
      // fallback ao nome armazenado na venda
    }

    // Buscar configurações do tenant (CNPJ, endereço, etc)
    let tenantConfig = null;
    try {
      tenantConfig = await TenantConfig.findOne();
    } catch (e) {
      // Se falhar, usa valores padrão
    }

    // Formatar itens para exibição
    const itemsFormatted = venda.items.map(item => ({
      name: item.name || item.nome || 'Produto',
      sku: item.sku,
      quantity: item.quantity || 0,
      unitPrice: item.unitPrice || 0,
      itemDiscount: item.discount || 0,
      itemDiscountType: item.discountType || 'percentage',
      total: item.total || 0,
    }));

    // Calcular desconto por item em reais
    const itemsWithDiscountAmount = itemsFormatted.map(item => {
      let discountAmount = 0;
      if (item.itemDiscount > 0) {
        const gross = item.unitPrice * item.quantity;
        discountAmount = item.itemDiscountType === 'fixed'
          ? Math.min(item.itemDiscount, gross)
          : gross * (Math.min(item.itemDiscount, 100) / 100);
      }
      return { ...item, discountAmount };
    });

    // Calcular total de descontos (itens + global)
    const itemDiscountsTotal = itemsWithDiscountAmount.reduce((sum, i) => sum + i.discountAmount, 0);
    const globalDiscountAmount = venda.globalDiscountType === 'fixed'
      ? Math.min(venda.globalDiscount || 0, venda.subtotal || 0)
      : (venda.subtotal || 0) * (Math.min(venda.globalDiscount || 0, 100) / 100);

    const receiptData = {
      sale: {
        id: venda._id.toString(),
        date: new Date(venda.createdAt).toLocaleDateString('pt-BR'),
        time: new Date(venda.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', hour12: false }),
        status: venda.status || 'CONCLUIDA',
      },
      store: {
        fantasyName: tenantConfig?.storeName || process.env.STORE_NAME || 'Sua Loja',
        cnpj: tenantConfig?.cnpj || process.env.STORE_CNPJ || '00.000.000/0000-00',
        address: tenantConfig?.address || process.env.STORE_ADDRESS || 'Endereço não configurado',
        phone: tenantConfig?.phone || process.env.STORE_PHONE || '(00) 0000-0000',
      },
      salesperson: {
        name: vendedorNome,
      },
      items: itemsWithDiscountAmount,
      totals: {
        subtotal: venda.subtotal || 0,
        itemDiscountsTotal: Math.round(itemDiscountsTotal * 100) / 100,
        globalDiscount: globalDiscountAmount,
        totalDiscount: Math.round((itemDiscountsTotal + globalDiscountAmount) * 100) / 100,
        finalTotal: venda.totalAmount || 0,
      },
      payment: {
        method: venda.paymentMethod,
        installments: venda.installments || 1,
        splits: venda.payments || [],
      },
      customer: venda.clienteName ? { name: venda.clienteName } : null,
    };

    return success(res, { receiptData });
  } catch (err) {
    console.error('[VendasController] getReceiptData error:', err.message);
    return error(res, err.message || 'Falha ao buscar dados do recibo.', 500);
  }
};

/**
 * GET /vendas/meu-relatorio
 * Retorna vendas do próprio vendedor agrupadas por dia para gráfico de barras.
 * Segurança: vendedor só acessa seus próprios dados (ownSalespersonId injetado no backend).
 * Lojista/admin/master podem passar ?vendorId= para consultar qualquer vendedor.
 * Campos de custo (purchasePrice) nunca são retornados.
 */
const getMeuRelatorio = async (req, res) => {
  try {
    const { Sale: TenantSale, Salesperson: TenantSalesperson } = getModels(req);

    let salespersonId;

    if (isVendedor(req)) {
      // Segurança: ignora qualquer vendorId da query e usa sempre o próprio.
      salespersonId = await getVendorSalespersonId(req);
      if (!salespersonId) {
        return success(res, {
          dias: [], totalVendas: 0, totalQuantidade: 0, totalVendido: 0,
          salesTarget: 0, salesRealized: 0, achievementPct: 0, scope: 'vendedor',
        });
      }
    } else {
      salespersonId = req.query.vendorId || null;
    }

    const { from, to } = isVendedor(req)
      ? buildVendorDateRange(req)
      : (() => {
          const range = parseDateRange(req);
          if (range) return range;
          const now = new Date();
          const d7 = new Date(now);
          d7.setDate(d7.getDate() - 6);
          d7.setHours(0, 0, 0, 0);
          return { from: d7, to: now };
        })();

    const match = { status: 'CONCLUIDA', createdAt: { $gte: from, $lte: to } };
    if (salespersonId) match.vendorId = salespersonId;

    // Busca dados de vendas e perfil do salesperson em paralelo.
    const [dados, salesperson] = await Promise.all([
      TenantSale.aggregate([
        { $match: match },
        {
          $group: {
            _id: {
              ano: { $year: '$createdAt' },
              mes: { $month: '$createdAt' },
              dia: { $dayOfMonth: '$createdAt' },
            },
            quantidadeVendas: { $sum: 1 },
            totalQuantidadeItens: { $sum: { $sum: '$items.quantity' } },
            totalVendido: { $sum: '$totalAmount' },
          },
        },
        { $sort: { '_id.ano': 1, '_id.mes': 1, '_id.dia': 1 } },
      ]),
      salespersonId
        ? TenantSalesperson.findById(salespersonId).select('salesTarget salesRealized name').lean()
        : null,
    ]);

    const dias = dados.map((d) => ({
      date: `${String(d._id.dia).padStart(2, '0')}/${String(d._id.mes).padStart(2, '0')}`,
      quantidadeVendas: d.quantidadeVendas,
      totalQuantidadeItens: d.totalQuantidadeItens,
      totalVendido: Math.round(d.totalVendido * 100) / 100,
    }));

    const totalVendas = dias.reduce((s, d) => s + d.quantidadeVendas, 0);
    const totalQuantidade = dias.reduce((s, d) => s + d.totalQuantidadeItens, 0);
    const totalVendido = Math.round(dias.reduce((s, d) => s + d.totalVendido, 0) * 100) / 100;

    const salesTarget = salesperson?.salesTarget ?? 0;
    const salesRealized = salesperson?.salesRealized ?? 0;
    // Percentual de atingimento: usa totalVendido do período ou salesRealized do perfil.
    // Para o vendedor logado usamos totalVendido (calculado em tempo real sobre o período filtrado).
    const achievementPct = salesTarget > 0
      ? Math.min(Math.round((totalVendido / salesTarget) * 100), 999)
      : 0;

    return success(res, {
      dias,
      totalVendas,
      totalQuantidade,
      totalVendido,
      salesTarget,
      salesRealized,
      achievementPct,
      vendorName: salesperson?.name || null,
      scope: isVendedor(req) ? 'vendedor' : 'all',
      range: { from: from.toISOString().slice(0, 10), to: to.toISOString().slice(0, 10) },
    });
  } catch (err) {
    console.error('[VendasController] getMeuRelatorio error:', err.message);
    return error(res, 'Falha ao buscar relatório.', 500);
  }
};

module.exports = {
  criarVenda,
  cancelarVenda,
  getVendas,
  getTopVendedores,
  getProdutosMaisVendidosPorVendedor,
  getStats,
  getTrend,
  getPaymentBreakdown,
  getReceiptData,
  getMeuRelatorio,
};
