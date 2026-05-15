const Cliente = require('../models/Cliente');
const Caixa = require('../models/Caixa');
const CashTransaction = require('../models/CashTransaction');
const { success, error } = require('../utils/apiResponse');

const getModels = (req) => ({
  Cliente: req.db.model('Cliente', Cliente.schema),
  Caixa: req.db.model('Caixa', Caixa.schema),
  CashTransaction: req.db.model('CashTransaction', CashTransaction.schema),
});

const listarClientes = async (req, res) => {
  try {
    const { search, onlyWithDebt, limit = 100 } = req.query;
    const filter = { isActive: true };
    if (search) {
      filter.$or = [
        { name: new RegExp(search, 'i') },
        { phone: new RegExp(search, 'i') },
      ];
    }
    if (onlyWithDebt === 'true') filter.saldoDevedor = { $gt: 0 };

    const { Cliente: TenantCliente } = getModels(req);
    const clientes = await TenantCliente.find(filter).sort({ name: 1 }).limit(parseInt(limit));
    return success(res, { clientes });
  } catch (err) {
    console.error('[ClientesController] listarClientes error:', err.message);
    return error(res, 'Falha ao listar clientes.', 500);
  }
};

const criarCliente = async (req, res) => {
  try {
    const { name, phone, observacao } = req.body;
    if (!name || !name.trim()) return error(res, 'Nome do cliente é obrigatório.', 400);

    const { Cliente: TenantCliente } = getModels(req);
    const cliente = await TenantCliente.create({
      name: name.trim(),
      phone: phone?.trim(),
      observacao: observacao?.trim(),
    });
    return success(res, { cliente }, 201);
  } catch (err) {
    console.error('[ClientesController] criarCliente error:', err.message);
    return error(res, err.message || 'Falha ao criar cliente.', 400);
  }
};

const atualizarCliente = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, phone, observacao, isActive } = req.body;

    const { Cliente: TenantCliente } = getModels(req);
    const cliente = await TenantCliente.findById(id);
    if (!cliente) return error(res, 'Cliente não encontrado.', 404);

    if (name !== undefined) cliente.name = name.trim();
    if (phone !== undefined) cliente.phone = phone?.trim();
    if (observacao !== undefined) cliente.observacao = observacao?.trim();
    if (isActive !== undefined) cliente.isActive = isActive;

    await cliente.save();
    return success(res, { cliente });
  } catch (err) {
    console.error('[ClientesController] atualizarCliente error:', err.message);
    return error(res, err.message || 'Falha ao atualizar cliente.', 400);
  }
};

/**
 * POST /clientes/:id/pagamento — customer pays down part of their debt.
 * Creates a RECEBIMENTO CashTransaction in the current open Caixa.
 * Observação opcional vira parte da descrição da transação.
 */
const registrarPagamento = async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, paymentMethod, observacao } = req.body;

    if (!amount || amount <= 0) {
      return error(res, 'Informe um valor positivo para o pagamento.', 400);
    }
    if (!['PIX', 'DINHEIRO', 'CREDITO', 'DEBITO'].includes(paymentMethod)) {
      return error(res, 'Método de pagamento inválido.', 400);
    }

    const { Cliente: TenantCliente, Caixa: TenantCaixa, CashTransaction: TenantTx } = getModels(req);

    const cliente = await TenantCliente.findById(id);
    if (!cliente) return error(res, 'Cliente não encontrado.', 404);
    if (amount > cliente.saldoDevedor) {
      return error(
        res,
        `Valor (R$ ${amount.toFixed(2)}) excede o saldo devedor (R$ ${cliente.saldoDevedor.toFixed(2)}).`,
        400
      );
    }

    const caixaAberto = await TenantCaixa.findOne({ status: 'ABERTO' });
    if (!caixaAberto) {
      return error(res, 'Nenhum caixa aberto. Abra um caixa antes de receber pagamentos.', 409);
    }

    const descricao = observacao?.trim()
      ? `Recebimento ${cliente.name}: ${observacao.trim()}`
      : `Recebimento ${cliente.name}`;

    const tx = await TenantTx.create({
      caixaId: caixaAberto._id,
      type: 'RECEBIMENTO',
      amount: Math.abs(amount),
      description: descricao,
      paymentMethod,
      clienteId: cliente._id,
      createdBy: req.user.id,
      createdByName: req.user.name || req.user.username,
    });

    cliente.saldoDevedor = Math.max(0, cliente.saldoDevedor - amount);
    await cliente.save();

    return success(res, { transaction: tx, cliente }, 201);
  } catch (err) {
    console.error('[ClientesController] registrarPagamento error:', err.message);
    return error(res, err.message || 'Falha ao registrar pagamento.', 400);
  }
};

module.exports = {
  listarClientes,
  criarCliente,
  atualizarCliente,
  registrarPagamento,
};
