const express = require('express');
const router = express.Router();
const usuarioController = require('../controllers/usuarioController');
const { verificarToken, esAdmin } = require('../middlewares/authMiddleware');

// Solo admins pueden gestionar alumnos
router.get('/', verificarToken, esAdmin, usuarioController.obtenerAlumnos);
router.post('/', verificarToken, esAdmin, usuarioController.crearAlumno);
router.put('/:id', verificarToken, esAdmin, usuarioController.actualizarAlumno);
router.delete('/:id', verificarToken, esAdmin, usuarioController.eliminarAlumno);

module.exports = router;