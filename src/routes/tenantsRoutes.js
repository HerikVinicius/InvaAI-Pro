const express = require('express');
const { protect, authorize } = require('../middlewares/auth');
const { listTenants } = require('../controllers/tenantsController');

const router = express.Router();

router.use(protect);
router.use(authorize('master'));

router.get('/', listTenants);

module.exports = router;
