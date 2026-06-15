const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { verificarToken, esAdmin } = require('../middlewares/authMiddleware');

// Solo admins principales pueden gestionar otros admins
// La validación de principal se hace en el frontend,
// pero el middleware esAdmin protege que al menos sea admin
router.get('/', verificarToken, esAdmin, adminController.obtenerAdmins);
router.get('/:id', verificarToken, esAdmin, adminController.obtenerAdmin);
router.post('/', verificarToken, esAdmin, adminController.crearAdmin);
router.put('/:id', verificarToken, esAdmin, adminController.actualizarAdmin);
router.delete('/:id', verificarToken, esAdmin, adminController.eliminarAdmin);

module.exports = router;