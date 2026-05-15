const express = require('express');
const router = express.Router();
const { generateInsights } = require('../controllers/aiInsightsController');
const { protect, authorize } = require('../middlewares/auth');

router.use(protect);
router.use(authorize('master', 'admin', 'lojista', 'gerente'));

router.post('/analyze', generateInsights);

module.exports = router;
