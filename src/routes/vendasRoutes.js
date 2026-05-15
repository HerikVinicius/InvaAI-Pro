const express = require('express');
const router = express.Router();
const {
  criarVenda,
  cancelarVenda,
  getVendas,
  getTopVendedores,
  getProdutosMaisVendidosPorVendedor,
  getStats,
  getTrend,
  getPaymentBreakdown,
  getReceiptData,
} = require('../controllers/vendasController');
const { protect, authorize } = require('../middlewares/auth');

router.use(protect);

router.post('/', criarVenda);
// Cancelamento é EXCLUSIVO do lojista/admin/master — vendedor nunca cancela.
router.post('/:id/cancel', authorize('master', 'admin', 'lojista'), cancelarVenda);
router.get('/:id/receipt-data', getReceiptData);
router.get('/', getVendas);

// Endpoints financeiros — bloqueados para vendedor (privacidade).
router.get('/stats',             authorize('master', 'admin', 'lojista'), getStats);
router.get('/trend',             authorize('master', 'admin', 'lojista'), getTrend);
router.get('/payment-breakdown', authorize('master', 'admin', 'lojista'), getPaymentBreakdown);

// Rankings: o controller decide a forma da resposta conforme o role.
router.get('/top-vendedores',     getTopVendedores);
router.get('/produtos/:vendorId', getProdutosMaisVendidosPorVendedor);

module.exports = router;
