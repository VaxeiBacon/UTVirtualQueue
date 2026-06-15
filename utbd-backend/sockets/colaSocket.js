const pool = require('../config/db');

module.exports = (io) => {
    // Escuchar cuando un cliente (Frontend) se conecta
    io.on('connection', (socket) => {
        console.log(`Cliente conectado: ${socket.id}`);

        //EVENTO: UNIRSE A UN EVENTO ESPECÍFICO
        socket.on('join_evento', async (eventoId) => {
            socket.join(eventoId);
            console.log(`Cliente ${socket.id} se unió a la sala del evento: ${eventoId}`);

            // Enviar inmediatamente el estado actual de la cola solo a este cliente que entra
            try {
                const [rows] = await pool.query('CALL sp_obtener_cola_en_vivo(?)', [eventoId]);
                socket.emit('actualizacion_cola', rows[0]);
            } catch (error) {
                console.error('Error al enviar cola inicial por socket:', error);
            }
        });

        //ACTUALIZAR TIEMPO DE ESPERA (Solo Admin)
        socket.on('cambiar_tiempo_espera', async ({ eventoId, nuevoTiempo }) => {
            try {
                // Ejecuta tu SP que actualiza y retorna los datos en el segundo bloque
                const [rows] = await pool.query('CALL sp_actualizar_tiempo_espera(?, ?)', [eventoId, nuevoTiempo]);
                const datosActualizados = rows[0][0];

                // Notificar a TODOS los usuarios dentro de la sala de este evento sobre el cambio de tiempo
                io.to(eventoId).emit('tiempo_espera_actualizado', datosActualizados);
            } catch (error) {
                console.error('Error en socket cambiar_tiempo_espera:', error);
                socket.emit('error_socket', { message: 'No se pudo actualizar el tiempo de espera.' });
            }
        });

        // --- EVENTO: AVANZAR TURNO (Solo Admin) ---
       socket.on('avanzar_siguiente_turno', async ({ eventoId }) => {
    try {
        // Descomenta esta línea:
        await pool.query('CALL sp_pasar_siguiente_turno(?)', [eventoId]);

        const [colaRows] = await pool.query('CALL sp_obtener_cola_en_vivo(?)', [eventoId]);
        const [detalleRows] = await pool.query('CALL sp_obtener_detalle_evento(?)', [eventoId]);

        io.to(eventoId).emit('actualizacion_cola', colaRows[0]);
        io.to(eventoId).emit('turno_actual_cambiado', {
            evento_id: eventoId,          // ← agrega evento_id
            turno_actual: detalleRows[0][0].turno_actual
        });
    } catch (error) {
        console.error('Error en avanzar_siguiente_turno:', error);
        socket.emit('error_socket', { message: 'Error al avanzar el turno.' });
    }
});

        //DESCONEXIÓN
        socket.on('disconnect', () => {
            console.log(`Cliente desconectado: ${socket.id}`);
            });
    });
};