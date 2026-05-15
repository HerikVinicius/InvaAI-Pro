const express = require('express');
const router = express.Router();
const multer = require('multer');
const {
  getInventory,
  addProduct,
  updateProduct,
  deleteProduct,
  getProductBySku,
  searchProducts,
  getInventoryLogs,
  getProductLogs,
} = require('../controllers/inventoryController');
const { importProducts, parseFile, commitImport, debugParsePdf } = require('../controllers/importController');
const { protect, authorize, checkPermission } = require('../middlewares/auth');
const { validate } = require('../middlewares/validate');

// Memory storage — we parse in-memory, never write to disk.
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

router.use(protect);

// Logs/relatórios: gerente tem acesso permanente via ROLE_DEFAULTS de permitir_cadastrar_produto.
router.get('/logs', checkPermission('permitir_cadastrar_produto'), getInventoryLogs);

router.get('/', getInventory);
router.get('/search', searchProducts);
router.get('/sku/:sku', getProductBySku);

// Histórico por produto também via checkPermission.
router.get('/:id/logs', checkPermission('permitir_cadastrar_produto'), getProductLogs);

// Debug: returns raw PDF text (remove in production)
router.post('/import/debug-pdf', upload.single('file'), debugParsePdf);
// Parse only — returns extracted products, no DB write.
router.post('/import/parse', checkPermission('permitir_cadastrar_produto'), upload.single('file'), parseFile);
// Commit — receives products with final price and saves to DB.
router.post('/import/commit', checkPermission('permitir_cadastrar_produto'), commitImport);
// Legacy single-step import (kept for backwards compat).
router.post('/import', checkPermission('permitir_cadastrar_produto'), upload.single('file'), importProducts);

// Adicionar/editar produto: gerente tem acesso permanente.
router.post('/', checkPermission('permitir_cadastrar_produto'), validate(['name', 'sku', 'category', 'quantity', 'price']), addProduct);
router.put('/:id', checkPermission('permitir_cadastrar_produto'), updateProduct);
// Deletar produto: mantém restrição a master/admin/lojista (gerente não deve excluir).
router.delete('/:id', authorize('master', 'admin', 'lojista'), deleteProduct);

module.exports = router;
