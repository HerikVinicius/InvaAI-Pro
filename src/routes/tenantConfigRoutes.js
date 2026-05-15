const express = require('express');
const router = express.Router();
const { getTenantConfig, updateTenantConfig } = require('../controllers/tenantConfigController');
const { protect } = require('../middlewares/auth');

router.use(protect);

router.get('/', getTenantConfig);
router.put('/', updateTenantConfig);

module.exports = router;
