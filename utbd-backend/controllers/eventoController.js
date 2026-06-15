const pool = require('../config/db');

//CREAR UN NUEVO EVENTO (Solo Admin)
exports.crearEvento = async (req, res) => {
    const { nombre, descripcion, fecha_inicio, fecha_fin, capacidad_maxima, tiempo_espera_aprox } = req.body;

    // Validaciones básicas
    if (!nombre || !fecha_inicio || !fecha_fin || !capacidad_maxima) {
        return res.status(400).json({ success: false, message: 'Faltan campos obligatorios para registrar el evento.' });
    }

    try {
        // Ejecuta sp_crear_evento(nombre, descripcion, fecha_inicio, fecha_fin, capacidad_maxima, tiempo_espera)
        // El SP se encarga de asignarle un UUID() automáticamente
        await pool.query('CALL sp_crear_evento(?, ?, ?, ?, ?, ?)', [
            nombre,
            descripcion || null,
            fecha_inicio,
            fecha_fin,
            capacidad_maxima,
            tiempo_espera_aprox || 5 // 5 minutos por defecto si no se envía
        ]);

        res.status(201).json({ success: true, message: 'Evento creado exitosamente.' });
    } catch (error) {
        console.error('Error en crearEvento:', error);
        res.status(500).json({ success: false, message: 'Error interno al crear el evento.' });
    }
};

//OBTENER EVENTOS ACTIVOS 
exports.obtenerEventosActivos = async (req, res) => {
    try {
        // Llama al SP que filtra por estado 'ACTIVO' y por fecha actual (NOW())
        const [rows] = await pool.query('CALL sp_buscar_eventos_activos()');
        const eventos = rows[0];

        res.status(200).json({ success: true, data: eventos });
    } catch (error) {
        console.error('Error en obtenerEventosActivos:', error);
        res.status(500).json({ success: false, message: 'Error al consultar eventos activos.' });
    }
};

//OBTENER DETALLE COMPLETO DE UN EVENTO
exports.obtenerDetalleEvento = async (req, res) => {
    const { id } = req.params; // ID del evento viene en la URL

    try {
        // Llama a sp_obtener_detalle_evento que incluye la subquery con el total_inscritos
        const [rows] = await pool.query('CALL sp_obtener_detalle_evento(?)', [id]);
        const detalle = rows[0][0];

        if (!detalle) {
            return res.status(404).json({ success: false, message: 'Evento no encontrado.' });
        }

        res.status(200).json({ success: true, data: detalle });
    } catch (error) {
        console.error('Error en obtenerDetalleEvento:', error);
        res.status(500).json({ success: false, message: 'Error al obtener el detalle del evento.' });
    }
};

//ACTUALIZAR DATOS DE UN EVENTO (Solo Admin) 
exports.actualizarEvento = async (req, res) => {
    const { id } = req.params;
    const { nombre, descripcion, fecha_inicio, fecha_fin, capacidad_maxima } = req.body;

    try {
        // Ejecuta sp_actualizar_evento(id, nombre, descripcion, fecha_inicio, fecha_fin, capacidad_maxima)
        await pool.query('CALL sp_actualizar_evento(?, ?, ?, ?, ?, ?)', [
            id, // VARCHAR(36)
            nombre,
            descripcion || null,
            fecha_inicio,
            fecha_fin,
            capacidad_maxima
        ]);

        res.status(200).json({ success: true, message: 'Evento actualizado correctamente.' });
    } catch (error) {
        console.error('Error en actualizarEvento:', error);
        res.status(500).json({ success: false, message: 'Error interno al actualizar el evento.' });
    }
};

//CAMBIAR ESTADO DEL EVENTO (Solo Admin - Pausar, Cancelar, Finalizar)
exports.cambiarEstado = async (req, res) => {
    const { id } = req.params;
    const { estado } = req.body; // 'ACTIVO', 'PAUSADO', 'FINALIZADO', 'CANCELADO'

    if (!estado) {
        return res.status(400).json({ success: false, message: 'El nuevo estado es requerido.' });
    }

    try {
        await pool.query('CALL sp_cambiar_estado_evento(?, ?)', [id, estado]);
        res.status(200).json({ success: true, message: `Estado del evento cambiado a ${estado}.` });
    } catch (error) {
        console.error('Error en cambiarEstado:', error);
        res.status(500).json({ success: false, message: 'Error al intentar cambiar el estado del evento.' });
    }
};



// OBTENER TODOS LOS EVENTOS HISTÓRICOS (Solo Admin)
exports.obtenerEventosHistoricos = async (req, res) => {
    try {
        const [rows] = await pool.query('CALL sp_ver_eventos_historicos()');
        res.status(200).json({ success: true, data: rows[0] });
    } catch (error) {
        console.error('Error en obtenerEventosHistoricos:', error);
        res.status(500).json({ success: false, message: 'Error al obtener eventos históricos.' });
    }
};
