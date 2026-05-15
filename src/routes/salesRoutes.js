const express = require('express');
const router = express.Router();
const { getMonthlySales, addMonthlySales, updateMonthlySales } = require('../controllers/salesController');
const { protect, authorize } = require('../middlewares/auth');
const { validate } = require('../middlewares/validate');

router.use(protect);

router.get('/', getMonthlySales);
router.post('/', authorize('master', 'editor'), validate(['month', 'year', 'revenue', 'unitsSold']), addMonthlySales);
router.put('/:id', authorize('master', 'editor'), updateMonthlySales);

module.exports = router;
