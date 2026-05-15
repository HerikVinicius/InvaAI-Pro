const express = require('express');
const { protect, checkPermission } = require('../middlewares/auth');
const {
  getCaixaAtual,
  abrirCaixa,
  fecharCaixa,
  listarCaixas,
  resumoCaixa,
  registrarSangria,
  listarTransacoesCaixa,
} = require('../controllers/caixaController');

const router = express.Router();

router.use(protect);

router.get('/', listarCaixas);
router.get('/atual', getCaixaAtual);
// Gerente tem acesso permanente via ROLE_DEFAULTS; outros roles via override ou padrão.
router.post('/abrir', checkPermission('permitir_abrir_caixa'), abrirCaixa);
router.post('/:id/fechar', checkPermission('permitir_abrir_caixa'), fecharCaixa);
router.post('/:id/sangria', checkPermission('permitir_abrir_caixa'), registrarSangria);
router.get('/:id/resumo', resumoCaixa);
router.get('/:id/transactions', listarTransacoesCaixa);

module.exports = router;
