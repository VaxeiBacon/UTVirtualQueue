const express = require('express');
const router = express.Router();
const colaController = require('../controllers/colaController');
const { verificarToken, esAdmin } = require('../middlewares/authMiddleware');

// Rutas de alumnos
router.post('/registro', verificarToken, colaController.registrarseEnEvento);
router.get('/mis-eventos', verificarToken, colaController.obtenerMisEventos);
router.get('/mi-turno/:evento_id', verificarToken, colaController.obtenerMiTurno);
router.post('/cancelar', verificarToken, colaController.cancelarMiTurno);

// Rutas de admin
router.get('/en-vivo/:evento_id', verificarToken, esAdmin, colaController.obtenerColaEnVivo);
router.post('/avanzar-turno', verificarToken, esAdmin, colaController.avanzarTurno);
router.post('/skipear-turno', verificarToken, esAdmin, colaController.skipearTurno);

module.exports = router;