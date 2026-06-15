const pool = require('../config/db');

// REGISTRAR ALUMNO EN LA COLA DE UN EVENTO
exports.registrarseEnEvento = async (req, res) => {
    const usuario_id = req.usuario.id;
    const { evento_id } = req.body;

    if (!evento_id) {
        return res.status(400).json({ success: false, message: 'El ID del evento es requerido.' });
    }

    try {
        const [rows] = await pool.query('CALL sp_registrarse_evento(?, ?)', [usuario_id, evento_id]);
        const turnoAsignado = rows[0][0].turno_asignado;

        res.status(201).json({
            success: true,
            message: 'Te has inscrito exitosamente en la fila.',
            data: { numero_turno: turnoAsignado }
        });
    } catch (error) {
        console.error('Error en registrarseEnEvento:', error);
        const errorMessage = error.sqlMessage || error.message || 'Error interno al registrar el turno.';
        res.status(400).json({ success: false, message: errorMessage });
    }
};

// OBTENER EL TURNO ACTUAL DEL ALUMNO LOGUEADO
exports.obtenerMiTurno = async (req, res) => {
    const usuario_id = req.usuario.id;
    const { evento_id } = req.params;

    try {
        const [rows] = await pool.query('CALL sp_obtener_mi_turno(?, ?)', [usuario_id, evento_id]);
        const miTurnoData = rows[0][0];

        if (!miTurnoData) {
            return res.status(404).json({ success: false, message: 'No tienes un turno asignado para este evento.' });
        }

        res.status(200).json({ success: true, data: miTurnoData });
    } catch (error) {
        console.error('Error en obtenerMiTurno:', error);
        res.status(500).json({ success: false, message: 'Error al consultar tu turno.' });
    }
};

// VER HISTORIAL O EVENTOS INSCRITOS DEL ALUMNO
exports.obtenerMisEventos = async (req, res) => {
    const usuario_id = req.usuario.id;

    try {
        const [rows] = await pool.query('CALL sp_mis_eventos(?)', [usuario_id]);
        res.status(200).json({ success: true, data: rows[0] });
    } catch (error) {
        console.error('Error en obtenerMisEventos:', error);
        res.status(500).json({ success: false, message: 'Error al obtener tu lista de eventos.' });
    }
};

// CANCELAR TURNO (Por el propio alumno)
exports.cancelarMiTurno = async (req, res) => {
    const usuario_id = req.usuario.id;
    const { evento_id } = req.body;

    try {
        await pool.query('CALL sp_cancelar_registro_evento(?, ?)', [usuario_id, evento_id]);
        res.status(200).json({ success: true, message: 'Turno cancelado correctamente.' });
    } catch (error) {
        console.error('Error en cancelarMiTurno:', error);
        res.status(500).json({ success: false, message: 'Error al intentar cancelar el turno.' });
    }
};

// AVANZAR AL SIGUIENTE TURNO (Solo Admin)
exports.avanzarTurno = async (req, res) => {
    const { evento_id } = req.body;
    if (!evento_id) {
        return res.status(400).json({ success: false, message: 'evento_id requerido.' });
    }

    try {
        const [rows] = await pool.query('CALL sp_pasar_siguiente_turno(?)', [evento_id]);
        const resultado = rows[0][0];
        
        // ← AGREGA ESTOS LOGS
        console.log('SP resultado:', resultado);

        const io = req.app.get('io');
        console.log('IO disponible:', !!io);
        
        if (io) {
            const [colaRows] = await pool.query('CALL sp_obtener_cola_en_vivo(?)', [evento_id]);
            const [detalleRows] = await pool.query('CALL sp_obtener_detalle_evento(?)', [evento_id]);
            
            console.log('Turno actual en BD:', detalleRows[0][0]?.turno_actual);
            console.log('Emitiendo a sala:', evento_id);

            io.to(evento_id).emit('actualizacion_cola', colaRows[0]);
            io.to(evento_id).emit('turno_actual_cambiado', {
                evento_id,
                turno_actual: detalleRows[0][0].turno_actual
            });
            
            console.log('Emitido correctamente');
        }

        res.status(200).json({ success: true, data: resultado });
    } catch (error) {
        console.error('Error en avanzarTurno:', error);
        res.status(500).json({ success: false, message: 'Error al avanzar el turno.' });
    }
};
// SKIPEAR TURNO / MARCAR AUSENTE (Solo Admin)
exports.skipearTurno = async (req, res) => {
    const { evento_id, numero_turno } = req.body;
    if (!evento_id || !numero_turno) {
        return res.status(400).json({ success: false, message: 'evento_id y numero_turno requeridos.' });
    }

    try {
        await pool.query('CALL sp_skipear_turno(?, ?)', [evento_id, numero_turno]);

        const io = req.app.get('io');
        if (io) {
            const [colaRows] = await pool.query('CALL sp_obtener_cola_en_vivo(?)', [evento_id]);
            const [detalleRows] = await pool.query('CALL sp_obtener_detalle_evento(?)', [evento_id]);

            io.to(evento_id).emit('actualizacion_cola', colaRows[0]);
            io.to(evento_id).emit('turno_actual_cambiado', {
                evento_id,
                turno_actual: detalleRows[0][0].turno_actual
            });
        }

        res.status(200).json({ success: true, message: 'Turno skipeado.' });
    } catch (error) {
        console.error('Error en skipearTurno:', error);
        res.status(500).json({ success: false, message: 'Error al skipear el turno.' });
    }
};

exports.obtenerColaEnVivo = async (req, res) => {
    const { evento_id } = req.params;
 
    try {
        const [rows] = await pool.query('CALL sp_obtener_cola_en_vivo(?)', [evento_id]);
        res.status(200).json({ success: true, data: rows[0] });


    } catch (error) {
        console.error('Error en obtenerColaEnVivo:', error);
        res.status(500).json({ success: false, message: 'Error al obtener la cola en vivo.' });
    }
};

