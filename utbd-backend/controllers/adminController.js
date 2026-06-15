const bcrypt = require('bcryptjs');
const pool = require('../config/db');


// OBTENER TODOS LOS ADMINS
exports.obtenerAdmins = async (req, res) => {
    try {
        const [rows] = await pool.query('CALL sp_obtener_admins()');
        res.status(200).json({ success: true, data: rows[0] });
    } catch (error) {
        console.error('Error en obtenerAdmins:', error);
        res.status(500).json({ success: false, message: 'Error al obtener administradores.' });
    }
};

// OBTENER UN ADMIN
exports.obtenerAdmin = async (req, res) => {
    const { id } = req.params;
    try {
        const [rows] = await pool.query('CALL sp_obtener_admin(?)', [id]);
        const admin = rows[0][0];
        if (!admin) return res.status(404).json({ success: false, message: 'Administrador no encontrado.' });
        res.status(200).json({ success: true, data: admin });
    } catch (error) {
        console.error('Error en obtenerAdmin:', error);
        res.status(500).json({ success: false, message: 'Error al obtener el administrador.' });
    }
};

// CREAR ADMIN
exports.crearAdmin = async (req, res) => {
    const { nombre, password, principal } = req.body;

    if (!nombre || !password) {
        return res.status(400).json({ success: false, message: 'Nombre y contraseña son requeridos.' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    try {
        await pool.query('CALL sp_crear_admin(?, ?, ?)', [
            nombre,
            hashedPassword,
            principal ? 1 : 0
        ]);
        res.status(201).json({ success: true, message: 'Administrador creado correctamente.' });
    } catch (error) {
        console.error('Error en crearAdmin:', error);
        const mensaje = error.sqlMessage || error.message || 'Error al crear el administrador.';
        res.status(400).json({ success: false, message: mensaje });
    }
};

// ACTUALIZAR ADMIN
exports.actualizarAdmin = async (req, res) => {
    const { id } = req.params;
    const { nombre, principal } = req.body;

    if (!nombre) {
        return res.status(400).json({ success: false, message: 'Requieres un nombre para editar' });
    }

    try {
        await pool.query('CALL sp_actualizar_admin(?, ?, ?)', [
            id,
            nombre,
            principal ? 1 : 0
        ]);
        res.status(200).json({ success: true, message: 'Administrador actualizado correctamente.' });
    } catch (error) {
        console.error('Error en actualizarAdmin:', error);
        const mensaje = error.sqlMessage || error.message || 'Error al actualizar el administrador.';
        res.status(400).json({ success: false, message: mensaje });
    }
};

// ELIMINAR ADMIN
exports.eliminarAdmin = async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query('CALL sp_eliminar_admin(?)', [id]);
        res.status(200).json({ success: true, message: 'Administrador eliminado correctamente.' });
    } catch (error) {
        console.error('Error en eliminarAdmin:', error);
        res.status(500).json({ success: false, message: 'Error al eliminar el administrador.' });
    }
};