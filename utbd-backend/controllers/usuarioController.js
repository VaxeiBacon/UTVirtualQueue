const pool = require('../config/db');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');

// Transporter de Gmail
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS,
    },
});

// CREAR ALUMNO DESDE PANEL ADMIN
exports.crearAlumno = async (req, res) => {
    const { nombre, email, carrera } = req.body;

    if (!nombre || !email || !carrera) {
        return res.status(400).json({ success: false, message: 'Todos los campos son requeridos.' });
    }

    // Validar formato de correo
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({ success: false, message: 'Correo electrónico inválido.' });
    }

    try {
        // Generar contraseña temporal aleatoria
        const passwordTemporal = Math.random().toString(36).slice(-8) + 
                                 Math.random().toString(36).slice(-4).toUpperCase();
        const hashedPassword = await bcrypt.hash(passwordTemporal, 10);

        // Llamar al SP que genera la matrícula automáticamente
        const [rows] = await pool.query('CALL sp_crear_usuario_admin(?, ?, ?, ?)', [
            nombre,
            email,
            hashedPassword,
            carrera,
        ]);

        const alumno = rows[0][0];

        // Enviar correo con credenciales
        await transporter.sendMail({
            from: `"Sistema UTBD" <${process.env.GMAIL_USER}>`,
            to: email,
            subject: 'Bienvenido al Sistema de Colas Virtuales - Tus credenciales',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 500px; margin: auto; padding: 30px; border-top: 5px solid #205846;">
                    <h2 style="color: #205846;">¡Bienvenido, ${alumno.nombre}!</h2>
                    <p>Tu cuenta ha sido creada en el Sistema de Colas Virtuales de la UTSLRC.</p>
                    <p>Aquí están tus credenciales de acceso:</p>
                    <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        <p style="margin: 5px 0;"><strong>Matrícula:</strong> ${alumno.matricula}</p>
                        <p style="margin: 5px 0;"><strong>Contraseña temporal:</strong> ${passwordTemporal}</p>
                    </div>
                    <p style="color: #888; font-size: 13px;">
                        Por seguridad, te recomendamos cambiar tu contraseña después de iniciar sesión por primera vez.
                    </p>
                    <p style="color: #888; font-size: 13px;">
                        Ingresa en: <a href="https://colavirtualut.utportfolio.cloud">colavirtualut.utportfolio.cloud</a>
                    </p>
                </div>
            `,
        });

        res.status(201).json({
            success: true,
            message: `Alumno registrado. Credenciales enviadas a ${email}.`,
            data: {
                id: alumno.id,
                nombre: alumno.nombre,
                matricula: alumno.matricula,
                email: alumno.email,
            }
        });
    } catch (error) {
        console.error('Error en crearAlumno:', error);
        const mensaje = error.sqlMessage || error.message || 'Error al crear el alumno.';
        res.status(400).json({ success: false, message: mensaje });
    }
};

// OBTENER TODOS LOS ALUMNOS
exports.obtenerAlumnos = async (req, res) => {
    try {
        const [rows] = await pool.query('CALL sp_obtener_usuarios()');
        res.status(200).json({ success: true, data: rows[0] });
    } catch (error) {
        console.error('Error en obtenerAlumnos:', error);
        res.status(500).json({ success: false, message: 'Error al obtener alumnos.' });
    }
};

// ACTUALIZAR ALUMNO
// ACTUALIZAR ALUMNO
exports.actualizarAlumno = async (req, res) => {
    const { id } = req.params;
    // Agregamos 'carrera' a la lista de datos que recibimos
    const { nombre, matricula, cuatrimestre, carrera } = req.body;

    try {
        // Agregamos el quinto parámetro '?' y el valor 'carrera' al arreglo
        await pool.query('CALL sp_actualizar_usuario(?, ?, ?, ?, ?)', [
            id, nombre, matricula, cuatrimestre, carrera
        ]);
        
        res.status(200).json({ success: true, message: 'Alumno actualizado correctamente.' });
    } catch (error) {
        console.error('Error en actualizarAlumno:', error);
        const mensaje = error.sqlMessage || error.message || 'Error al actualizar el alumno.';
        res.status(400).json({ success: false, message: mensaje });
    }
};

// ELIMINAR ALUMNO
exports.eliminarAlumno = async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query('CALL sp_eliminar_usuario(?)', [id]);
        res.status(200).json({ success: true, message: 'Alumno eliminado correctamente.' });
    } catch (error) {
        console.error('Error en eliminarAlumno:', error);
        res.status(500).json({ success: false, message: 'Error al eliminar el alumno.' });
    }
};