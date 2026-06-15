const pool = require('../config/db');
const nodemailer = require('nodemailer');

// Almacén temporal de códigos en memoria
// { matricula: { codigo, expira } }
const codigosTemporales = {};

// Configurar transporter de Gmail
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS, // App Password de Gmail, no tu contraseña real
    },
});

// PASO 1 — Verificar matrícula y enviar código al correo
exports.enviarCodigo = async (req, res) => {
    const { matricula } = req.body;

    if (!matricula) {
        return res.status(400).json({ success: false, message: 'La matrícula es requerida.' });
    }

    try {
        const [rows] = await pool.query('CALL sp_obtener_email_usuario(?)', [matricula]);
        const usuario = rows[0][0];

        if (!usuario || !usuario.email) {
            return res.status(404).json({ success: false, message: 'No se encontró un usuario con esa matrícula o no tiene correo registrado.' });
        }

        // Generar código de 6 dígitos
        const codigo = Math.floor(100000 + Math.random() * 900000).toString();
        const expira = Date.now() + 10 * 60 * 1000; // 10 minutos

        // Guardar en memoria
        codigosTemporales[matricula] = { codigo, expira };

        // Enviar correo
        await transporter.sendMail({
            from: `"Sistema UTBD" <${process.env.GMAIL_USER}>`,
            to: usuario.email,
            subject: 'Código de verificación - Restablecer contraseña',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 480px; margin: auto; padding: 30px; border-top: 5px solid #205846;">
                    <h2 style="color: #205846;">Restablecer contraseña</h2>
                    <p>Hola <strong>${usuario.nombre}</strong>,</p>
                    <p>Tu código de verificación es:</p>
                    <div style="font-size: 36px; font-weight: bold; color: #205846; letter-spacing: 8px; margin: 20px 0;">
                        ${codigo}
                    </div>
                    <p style="color: #888; font-size: 13px;">Este código expira en 10 minutos. Si no solicitaste esto, ignora este mensaje.</p>
                </div>
            `,
        });

        res.status(200).json({ success: true, message: `Código enviado al correo registrado.` });
    } catch (error) {
        console.error('Error en enviarCodigo:', error);
        res.status(500).json({ success: false, message: 'Error al enviar el código.' });
    }
};

// PASO 2 — Validar código
exports.validarCodigo = (req, res) => {
    const { matricula, codigo } = req.body;

    if (!matricula || !codigo) {
        return res.status(400).json({ success: false, message: 'Matrícula y código requeridos.' });
    }

    const registro = codigosTemporales[matricula];

    if (!registro) {
        return res.status(400).json({ success: false, message: 'No hay un código activo para esta matrícula.' });
    }

    if (Date.now() > registro.expira) {
        delete codigosTemporales[matricula];
        return res.status(400).json({ success: false, message: 'El código ha expirado. Solicita uno nuevo.' });
    }

    if (registro.codigo !== codigo) {
        return res.status(400).json({ success: false, message: 'Código incorrecto.' });
    }

    // Marcar como validado para permitir el cambio de contraseña
    codigosTemporales[matricula].validado = true;

    res.status(200).json({ success: true, message: 'Código validado correctamente.' });
};

// PASO 3 — Cambiar contraseña
exports.cambiarPassword = async (req, res) => {
    const { matricula, nuevaPassword } = req.body;

    if (!matricula || !nuevaPassword) {
        return res.status(400).json({ success: false, message: 'Matrícula y nueva contraseña requeridas.' });
    }
    const hashedPassword = await bcrypt.hash(nuevaPassword, 10);
    const registro = codigosTemporales[matricula];

    if (!registro || !registro.validado) {
        return res.status(403).json({ success: false, message: 'Debes validar el código antes de cambiar la contraseña.' });
    }

    try {
        await pool.query('CALL sp_actualizar_password(?, ?)', [matricula, hashedPassword]);

        // Limpiar el código usado
        delete codigosTemporales[matricula];

        res.status(200).json({ success: true, message: 'Contraseña actualizada correctamente.' });
    } catch (error) {
        console.error('Error en cambiarPassword:', error);
        res.status(500).json({ success: false, message: 'Error al actualizar la contraseña.' });
    }
};