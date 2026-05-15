const express = require('express');
const { protect, authorize } = require('../middlewares/auth');
const {
  listarClientes,
  criarCliente,
  atualizarCliente,
  registrarPagamento,
} = require('../controllers/clientesController');

const router = express.Router();

router.use(protect);

// Listagem/edição/recebimento — fluxo financeiro, vendedor não participa.
router.get('/',              authorize('master', 'admin', 'lojista'), listarClientes);
router.post('/',             authorize('master', 'admin', 'lojista'), criarCliente);
router.put('/:id',           authorize('master', 'admin', 'lojista'), atualizarCliente);
router.post('/:id/pagamento', authorize('master', 'admin', 'lojista'), registrarPagamento);

module.exports = router;
