const jwt = require('jsonwebtoken');

// Verificar que el usuario esté autenticado
exports.verificarToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    // Validar el formato Bearer
    const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

    if (!token) {
        return res.status(403).json({ success: false, message: 'Token de autenticación requerido.' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        // Asignar a 'req.usuario' para consistencia en todo el backend
        req.usuario = decoded; 
        next();
    } catch (error) {
        return res.status(401).json({ success: false, message: 'Token inválido o expirado.' });
    }
};

// Restringir accesos exclusivos para Administradores
exports.esAdmin = (req, res, next) => {
    // Verificar que el usuario exista y tenga el rol
    if (req.usuario && req.usuario.rol === 'ADMIN') {
        next();
    } else {
        return res.status(403).json({ success: false, message: 'Acceso denegado. Se requieren permisos de administrador.' });
    }
};