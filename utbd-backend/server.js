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

const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

app.use(cors({
    origin: CLIENT_URL,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    credentials: true
}));

app.use(express.json());

// Rutas API REST
app.use('/api/auth', authRoutes);
app.use('/api/eventos', eventoRoutes);
app.use('/api/cola', colaRoutes);
app.use('/api/admins', adminRoutes);
app.use('/api/reset', resetRoutes);
app.use('/api/alumnos', usuarioRoutes);

app.get('/', (req, res) => {
    res.send('Servidor HTTP y WebSockets corriendo perfectamente.');
});

const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: CLIENT_URL,
        methods: ['GET', 'POST'],
        credentials: true
    }
});

inicializarColaSockets(io);
app.set('io', io);

const PORT = process.env.PORT || 5003;
server.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
});