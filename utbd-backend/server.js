const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

const adminRoutes = require('./routes/adminRoutes');
const authRoutes = require('./routes/authRoutes');
const eventoRoutes = require('./routes/eventoRoutes');
const colaRoutes = require('./routes/colaRoutes');
const inicializarColaSockets = require('./sockets/colaSocket'); 
const resetRoutes = require('./routes/resetRoutes');
const usuarioRoutes = require('./routes/usuarioRoutes');
const app = express();






app.use(cors());
app.use(express.json());

// Rutas API REST (Síncronas)
app.use('/api/auth', authRoutes);
app.use('/api/eventos', eventoRoutes);
app.use('/api/cola', colaRoutes);
app.use('/api/admins', adminRoutes);
app.use('/api/reset', resetRoutes);
app.use('/api/alumnos', usuarioRoutes);

app.get('/', (req, res) => {
    res.send('Servidor HTTP y WebSockets corriendo perfectamente.');
});

// 1. Crear el servidor HTTP nativo usando la app de Express
const server = http.createServer(app);

// 2. Inicializar Socket.io sobre el servidor HTTP
const io = new Server(server, {
    cors: {
        origin: "*", 
        methods: ["GET", "POST"]
    }
});

// 3. Pasar la instancia de 'io' a nuestro módulo especializado de sockets
inicializarColaSockets(io);
app.set('io', io);

const PORT = process.env.PORT || 3000;
// CRITICAL: Escuchar desde 'server', NO desde 'app'
server.listen(PORT, () => {
    console.log(`Servidor completo corriendo en el puerto ${PORT}`);
});