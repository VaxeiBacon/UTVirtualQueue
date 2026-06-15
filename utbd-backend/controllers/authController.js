const pool = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// LOGIN DE ALUMNOS
exports.loginUsuario = async (req, res) => {
    const { matricula, password } = req.body;
    if (!matricula || !password) {
        return res.status(400).json({ success: false, message: 'Matrícula y contraseña requeridas.' });
    }
    try {
        const [rows] = await pool.query('CALL sp_login_usuario(?)', [matricula]);
        const usuario = rows[0][0];

        if (!usuario) {
            return res.status(401).json({ success: false, message: 'Credenciales inválidas.' });
        }

        const passwordCorrecto = await bcrypt.compare(password, usuario.password);
        if (!passwordCorrecto) {
            return res.status(401).json({ success: false, message: 'Credenciales inválidas.' });
        }

        const token = jwt.sign(
            { id: usuario.id, matricula: usuario.matricula, rol: 'USUARIO' },
            process.env.JWT_SECRET,
            { expiresIn: '8h' }
        );

        res.status(200).json({
            success: true,
            message: 'Login exitoso',
            token,
            user: {
                id: usuario.id,
                nombre: usuario.nombre,
                matricula: usuario.matricula,
                cuatrimestre: usuario.cuatrimestre,
                rol: 'USUARIO'
            }
        });
    } catch (error) {
        console.error('Error en loginUsuario:', error);
        res.status(500).json({ success: false, message: 'Error interno del servidor.' });
    }
};

// LOGIN DE ADMINISTRADORES
exports.loginAdmin = async (req, res) => {
    const { matricula, password } = req.body;
    if (!matricula || !password) {
        return res.status(400).json({ success: false, message: 'Matrícula y contraseña requeridas.' });
    }
    try {
        const [rows] = await pool.query('CALL sp_login_admin(?)', [matricula]);
        const admin = rows[0][0];

        if (!admin) {
            return res.status(401).json({ success: false, message: 'Credenciales inválidas.' });
        }

     
        const passwordCorrecto = await bcrypt.compare(password, admin.password);
        if (!passwordCorrecto) {
            return res.status(401).json({ success: false, message: 'Credenciales inválidas.' });
        }

        const token = jwt.sign(
            { id: admin.id, matricula: admin.matricula, rol: 'ADMIN', principal: admin.principal },
            process.env.JWT_SECRET,
            { expiresIn: '8h' }
        );

        res.status(200).json({
            success: true,
            message: 'Login administrativo exitoso',
            token,
            user: {
                id: admin.id,
                nombre: admin.nombre,
                matricula: admin.matricula,
                principal: admin.principal,
                rol: 'ADMIN'
            }
        });
    } catch (error) {
        console.error('Error en loginAdmin:', error);
        res.status(500).json({ success: false, message: 'Error interno del servidor.' });
    }
};

// REGISTRO DE ALUMNO
exports.registroUsuario = async (req, res) => {
    const { nombre, matricula, email, cuatrimestre, password } = req.body;

    if (!nombre || !matricula || !email || !cuatrimestre || !password) {
        return res.status(400).json({ success: false, message: 'Todos los campos son requeridos.' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    try {
        await pool.query('CALL sp_crear_usuario(?, ?, ?, ?, ?)', [
            nombre,
            matricula,
            email,
            hashedPassword,
            parseInt(cuatrimestre, 10)
        ]);

        res.status(201).json({ success: true, message: 'Usuario registrado correctamente.' });
    } catch (error) {
        console.error('Error en registroUsuario:', error);
        const mensaje = error.sqlMessage || error.message || 'Error interno al registrar.';
        res.status(400).json({ success: false, message: mensaje });
    }
};