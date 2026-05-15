const express = require('express');
const router = express.Router();
const { login, me } = require('../controllers/authController');
const { protect } = require('../middlewares/auth');
const { validate } = require('../middlewares/validate');

router.post('/login', validate(['username', 'password']), login);
// Retorna o usuário atual com campos atualizados do banco (inclusive overrides).
router.get('/me', protect, me);

module.exports = router;
