const express = require('express');
const router = express.Router();
const { getDashboardSummary } = require('../controllers/dashboardController');
const { protect, authorize } = require('../middlewares/auth');

router.use(protect);

// Dashboard financeiro/operacional — bloqueado para vendedor.
router.get('/summary', authorize('master', 'admin', 'lojista'), getDashboardSummary);

module.exports = router;
