const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Rutas públicas de Login
router.post('/login/usuario', authController.loginUsuario);
router.post('/login/admin', authController.loginAdmin);

router.post('/registro', authController.registroUsuario);
module.exports = router;