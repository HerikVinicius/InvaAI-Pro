const Caixa = require('../models/Caixa');
const CashTransaction = require('../models/CashTransaction');
const { success, error } = require('../utils/apiResponse');

const MAX_HOURS_OPEN = 24;

const getModels = (req) => ({
  Caixa: req.db.model('Caixa', Caixa.schema),
  CashTransaction: req.db.model('CashTransaction', CashTransaction.schema),
});

/**
 * GET /caixa/atual — returns the currently open caixa for the tenant, or null.
 */
const getCaixaAtual = async (req, res) => {
  try {
    const { Caixa: TenantCaixa } = getModels(req);
    const caixa = await TenantCaixa.findOne({ status: 'ABERTO' }).sort({ openedAt: -1 });
    return success(res, { caixa });
  } catch (err) {
    console.error('[CaixaController] getCaixaAtual error:', err.message);
    return error(res, 'Falha ao buscar caixa atual.', 500);
  }
};

/**
 * POST /caixa/abrir — opens a new turno. Refuses if one is already open.
 */
const abrirCaixa = async (req, res) => {
  try {
    const { initialAmount = 0, observacao } = req.body;

    if (initialAmount < 0) {
      return error(res, 'Valor inicial não pode ser negativo.', 400);
    }

    const { Caixa: TenantCaixa } = getModels(req);
    const aberto = await TenantCaixa.findOne({ status: 'ABERTO' });
    if (aberto) {
      const hoursOpen = (Date.now() - new Date(aberto.openedAt).getTime()) / (1000 * 60 * 60);
      if (hoursOpen >= MAX_HOURS_OPEN) {
        return error(res, {
          code: 'CAIXA_EXPIRED',
          message: 'Caixa aberto há mais de 24h. Feche-o (informando o valor contado) antes de abrir um novo.',
          pendingCaixa: {
            _id: aberto._id,
            openedAt: aberto.openedAt,
            openedByName: aberto.openedByName,
            initialAmount: aberto.initialAmount,
            hoursOpen: Math.floor(hoursOpen),
          },
        }, 409);
      }
      return error(res, 'Já existe um caixa aberto. Feche-o antes de abrir um novo.', 409);
    }

    const caixa = await TenantCaixa.create({
      status: 'ABERTO',
      openedAt: new Date(),
      openedBy: req.user.id,
      openedByName: req.user.name || req.user.username,
      initialAmount,
      observacao,
    });

    return success(res, { caixa }, 201);
  } catch (err) {
    console.error('[CaixaController] abrirCaixa error:', err.message);
    return error(res, err.message || 'Falha ao abrir caixa.', 400);
  }
};

/**
 * POST /caixa/:id/fechar — closes the caixa, snapshots its summary.
 */
const fecharCaixa = async (req, res) => {
  try {
    const { id } = req.params;
    const { countedAmount, observacao } = req.body;

    const { Caixa: TenantCaixa, CashTransaction: TenantTx } = getModels(req);
    const caixa = await TenantCaixa.findById(id);
    if (!caixa) return error(res, 'Caixa não encontrado.', 404);
    if (caixa.status === 'FECHADO') return error(res, 'Caixa já está fechado.', 409);

    const totals = await computeCaixaTotals(TenantTx, id);
    const saldoEsperado = (caixa.initialAmount || 0) + totals.entradas + totals.saidas;
    const diferenca = countedAmount != null ? countedAmount - saldoEsperado : 0;

    caixa.status = 'FECHADO';
    caixa.closedAt = new Date();
    caixa.closedBy = req.user.id;
    caixa.closedByName = req.user.name || req.user.username;
    caixa.countedAmount = countedAmount;
    caixa.observacao = observacao || caixa.observacao;
    caixa.summary = {
      entradas: totals.entradas,
      saidas: totals.saidas,
      saldoEsperado,
      diferenca,
    };
    await caixa.save();

    return success(res, { caixa });
  } catch (err) {
    console.error('[CaixaController] fecharCaixa error:', err.message);
    return error(res, err.message || 'Falha ao fechar caixa.', 400);
  }
};

/**
 * GET /caixa — list caixas (most recent first), supports ?status=&from=&to=.
 */
const listarCaixas = async (req, res) => {
  try {
    const { status, from, to, limit = 50 } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (from || to) {
      filter.openedAt = {};
      if (from) filter.openedAt.$gte = new Date(from);
      if (to) filter.openedAt.$lte = new Date(to);
    }

    const { Caixa: TenantCaixa } = getModels(req);
    const caixas = await TenantCaixa.find(filter)
      .sort({ openedAt: -1 })
      .limit(parseInt(limit));

    return success(res, { caixas });
  } catch (err) {
    console.error('[CaixaController] listarCaixas error:', err.message);
    return error(res, 'Falha ao listar caixas.', 500);
  }
};

/**
 * GET /caixa/:id/resumo — full breakdown for the report screen.
 *   - entradas (Vendas + Recebimentos)
 *   - saidas (Sangrias + Estornos), each with its description
 *   - saldo final
 */
const resumoCaixa = async (req, res) => {
  try {
    const { id } = req.params;
    const { Caixa: TenantCaixa, CashTransaction: TenantTx } = getModels(req);

    const caixa = await TenantCaixa.findById(id);
    if (!caixa) return error(res, 'Caixa não encontrado.', 404);

    const transactions = await TenantTx.find({ caixaId: id }).sort({ createdAt: -1 });

    const byType = transactions.reduce(
      (acc, t) => {
        acc[t.type] = (acc[t.type] || 0) + t.amount;
        return acc;
      },
      { VENDA: 0, RECEBIMENTO: 0, SANGRIA: 0, ESTORNO: 0 }
    );

    const entradasTotais = byType.VENDA + byType.RECEBIMENTO;
    const saidasTotais = byType.SANGRIA + byType.ESTORNO; // already negative
    const saldoFinal = (caixa.initialAmount || 0) + entradasTotais + saidasTotais;

    // Audit-friendly: list every outflow with its justification.
    const justificativasSaidas = transactions
      .filter((t) => t.type === 'SANGRIA' || t.type === 'ESTORNO')
      .map((t) => ({
        _id: t._id,
        type: t.type,
        amount: t.amount,
        description: t.description,
        saleId: t.saleId,
        createdAt: t.createdAt,
        createdByName: t.createdByName,
      }));

    return success(res, {
      caixa,
      resumo: {
        initialAmount: caixa.initialAmount || 0,
        entradas: {
          vendas: byType.VENDA,
          recebimentos: byType.RECEBIMENTO,
          total: entradasTotais,
        },
        saidas: {
          sangrias: byType.SANGRIA,
          estornos: byType.ESTORNO,
          total: saidasTotais,
        },
        saldoFinal,
      },
      justificativasSaidas,
      transactions,
    });
  } catch (err) {
    console.error('[CaixaController] resumoCaixa error:', err.message);
    return error(res, 'Falha ao gerar resumo do caixa.', 500);
  }
};

/**
 * POST /caixa/:id/sangria — register a cash withdrawal (saida).
 */
const registrarSangria = async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, description } = req.body;

    if (!amount || amount <= 0) {
      return error(res, 'Informe um valor positivo para a sangria.', 400);
    }
    if (!description || !description.trim()) {
      return error(res, 'Descrição é obrigatória para sangrias.', 400);
    }

    const { Caixa: TenantCaixa, CashTransaction: TenantTx } = getModels(req);
    const caixa = await TenantCaixa.findById(id);
    if (!caixa) return error(res, 'Caixa não encontrado.', 404);
    if (caixa.status !== 'ABERTO') return error(res, 'Caixa está fechado.', 409);

    const tx = await TenantTx.create({
      caixaId: caixa._id,
      type: 'SANGRIA',
      amount: -Math.abs(amount),
      description: description.trim(),
      createdBy: req.user.id,
      createdByName: req.user.name || req.user.username,
    });

    return success(res, { transaction: tx }, 201);
  } catch (err) {
    console.error('[CaixaController] registrarSangria error:', err.message);
    return error(res, err.message || 'Falha ao registrar sangria.', 400);
  }
};

/**
 * GET /caixa/:id/transactions — paginated list of every movement in a caixa.
 */
const listarTransacoesCaixa = async (req, res) => {
  try {
    const { id } = req.params;
    const { type, limit = 100 } = req.query;

    const filter = { caixaId: id };
    if (type) filter.type = type;

    const { CashTransaction: TenantTx } = getModels(req);
    const transactions = await TenantTx.find(filter)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    return success(res, { transactions });
  } catch (err) {
    console.error('[CaixaController] listarTransacoesCaixa error:', err.message);
    return error(res, 'Falha ao listar transações.', 500);
  }
};

/**
 * Helper: sums up totals (entradas/saidas) for a given caixa.
 */
const computeCaixaTotals = async (TenantTx, caixaId) => {
  const result = await TenantTx.aggregate([
    { $match: { caixaId: new (require('mongoose').Types.ObjectId)(caixaId) } },
    {
      $group: {
        _id: null,
        entradas: {
          $sum: { $cond: [{ $gt: ['$amount', 0] }, '$amount', 0] },
        },
        saidas: {
          $sum: { $cond: [{ $lt: ['$amount', 0] }, '$amount', 0] },
        },
      },
    },
  ]);

  return result[0] || { entradas: 0, saidas: 0 };
};

module.exports = {
  getCaixaAtual,
  abrirCaixa,
  fecharCaixa,
  listarCaixas,
  resumoCaixa,
  registrarSangria,
  listarTransacoesCaixa,
};
