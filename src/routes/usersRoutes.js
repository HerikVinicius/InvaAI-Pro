const express = require('express');
const router = express.Router();
const {
  getAllUsers,
  getUser,
  createUser,
  updateUser,
  toggleAiChat,
  updateUserRole,
  toggleUserActive,
  resetPassword,
} = require('../controllers/usersController');
const { protect, authorize } = require('../middlewares/auth');

router.use(protect);

// MASTER vê tudo. ADMIN vê lojistas/vendedores. LOJISTA vê seus próprios vendedores.
router.get('/', authorize('admin', 'master', 'lojista'), getAllUsers);
router.get('/:userId', authorize('admin', 'master', 'lojista'), getUser);

// MASTER: qualquer role. ADMIN: lojista/vendedor. LOJISTA: vendedor (próprio tenant).
router.post('/', authorize('admin', 'master', 'lojista'), createUser);

router.patch('/:userId', authorize('admin', 'master', 'lojista'), updateUser);

router.put('/:userId/ai-chat', authorize('admin', 'master', 'lojista'), toggleAiChat);

// Apenas ADMIN e MASTER podem mudar roles.
router.put('/:userId/role', authorize('admin', 'master'), updateUserRole);

router.put('/:userId/active', authorize('admin', 'master', 'lojista'), toggleUserActive);

// Reset de senha (substitui o "esqueci minha senha" — não há email).
router.post('/:userId/reset-password', authorize('admin', 'master', 'lojista'), resetPassword);

module.exports = router;
