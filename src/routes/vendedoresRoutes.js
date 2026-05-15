const express = require('express');
const router = express.Router();
const { getVendedores, createVendedor } = require('../controllers/vendedoresController');
const { protect, authorize } = require('../middlewares/auth');
const { validate } = require('../middlewares/validate');

router.use(protect);

router.get('/', getVendedores);
router.post('/', authorize('master', 'admin', 'lojista'), validate(['name']), createVendedor);
router.put('/:id', authorize('master', 'admin', 'lojista'), require('../controllers/vendedoresController').updateVendedor);
router.delete('/:id', authorize('master', 'admin', 'lojista'), require('../controllers/vendedoresController').deleteVendedor);

module.exports = router;
