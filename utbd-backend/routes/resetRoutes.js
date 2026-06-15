const express = require('express');
const router = express.Router();
const resetController = require('../controllers/resetController');

router.post('/enviar-codigo', resetController.enviarCodigo);
router.post('/validar-codigo', resetController.validarCodigo);
router.post('/cambiar-password', resetController.cambiarPassword);
router.post('/cambiar-password-autenticado', resetController.cambiarPasswordAutenticado);
module.exports = router;