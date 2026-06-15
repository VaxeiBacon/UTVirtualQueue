import "./HomePage.css";
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Navbar from "./componentes/Navbar";
import Footer from "./componentes/Footer";
import Breadcrumb from "../components/Breadcrumb";
import api from "../../services/api";
import { io } from "socket.io-client";

export default function HomePage() {
  const [misFilasActivas, setMisFilasActivas] = useState([]);
  const [eventoModal, setEventoModal] = useState(null);
  const [loading, setLoading] = useState(true);

  const usuarioLogueado = JSON.parse(localStorage.getItem("user") || "null");
  const token = localStorage.getItem("token");

  const cargarMisFilas = async () => {
    if (!usuarioLogueado || !token) {
      setLoading(false);
      return;
    }
    try {
      const res = await api.get(`/cola/mis-eventos`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const lista = res.data?.data || res.data || [];
      setMisFilasActivas(lista.filter(e => e?.mi_estado_turno === "EN_COLA" || e?.estado === "EN_COLA"));
    } catch (err) {
      console.error("Error al cargar filas:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarMisFilas();
  }, []);

  // WebSockets solo para actualizar turnos si hay filas activas
  useEffect(() => {
    if (!token || misFilasActivas.length === 0) return;
    const socket = io(import.meta.env.VITE_SOCKET_URL || "http://localhost:5003");
    socket.on("actualizar_turnos", (data) => {
      setMisFilasActivas(prev => prev.map(f => f.evento_id === data.evento_id ? {...f, evento_turno_actual: data.nuevo_turno_actual} : f));
    });
    return () => socket.disconnect();
  }, [token, misFilasActivas.length]);

  return (
    <div className="home-page">
      <Navbar />
      <Breadcrumb />
      <div className="home-container">
        
        {/* HERO REDISEÑADO: Botón central */}
        <div className="hero-main">
          <h1>Bienvenido al Sistema de Colas</h1>
          <p>Gestiona tu atención y monitorea tus turnos en tiempo real.</p>
          <Link to="/eventos" className="btn-cta-principal">
            Ver Eventos Disponibles
          </Link>
        </div>

        {/* SOLO MOSTRAR SI TIENE TURNOS ACTIVOS */}
        {misFilasActivas.length > 0 && (
          <div className="home-section">
            <h2>Mis turnos en fila</h2>
            <div className="fila-grid">
              {misFilasActivas.map((fila) => (
                <div className="fila-card" key={fila.registro_id}>
                  <h3>{fila.evento_nombre}</h3>
                  <p>Turno actual: <strong>{fila.evento_turno_actual || "0"}</strong></p>
                  <button className="btn-ver" onClick={() => setEventoModal(fila)}>Ver detalles</button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {eventoModal && (
        <div className="modal-overlay" onClick={() => setEventoModal(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>{eventoModal.evento_nombre}</h2>
            <p>Tu turno: {eventoModal.numero_turno}</p>
            <button onClick={() => setEventoModal(null)}>Cerrar</button>
          </div>
        </div>
      )}
      <Footer />
    </div>
  );
}