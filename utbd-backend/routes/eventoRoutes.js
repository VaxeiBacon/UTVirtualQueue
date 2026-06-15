const express = require('express');
const router = express.Router();
const eventoController = require('../controllers/eventoController');
const { verificarToken, esAdmin } = require('../middlewares/authMiddleware');

// RUTAS PÚBLICAS
router.get('/activos', eventoController.obtenerEventosActivos);

// RUTAS PROTEGIDAS
router.get('/historicos', verificarToken, esAdmin, eventoController.obtenerEventosHistoricos);
router.get('/:id', verificarToken, eventoController.obtenerDetalleEvento);

// RUTAS ADMINISTRATIVAS
router.post('/', verificarToken, esAdmin, eventoController.crearEvento);
router.put('/:id', verificarToken, esAdmin, eventoController.actualizarEvento);
router.patch('/:id/estado', verificarToken, esAdmin, eventoController.cambiarEstado);

module.exports = router;