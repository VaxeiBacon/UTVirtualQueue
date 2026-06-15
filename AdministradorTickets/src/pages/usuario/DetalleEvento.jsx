// src/pages/usuario/DetalleEvento.jsx
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { io } from "socket.io-client";
import api from "../../services/api";
import Navbar from "./componentes/Navbar";
import Footer from "./componentes/Footer";
import Breadcrumb from "../components/Breadcrumb";
import "./DetalleEvento.css";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:3000";
const socket = io(SOCKET_URL, { autoConnect: false });

export default function DetalleEvento() {
  const { id: evento_id } = useParams();

  const [evento, setEvento] = useState(null);
  const [miTurno, setMiTurno] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [procesando, setProcesando] = useState(false);

  useEffect(() => {
    const inicializarDatos = async () => {
      try {
        const [resEvento, resTurno] = await Promise.all([
          api.get(`/eventos/activos`),
          api.get(`/cola/mi-turno/${evento_id}`).catch(() => ({ data: { success: false } }))
        ]);

        if (resEvento.data.success) {
          const eventoActual = resEvento.data.data.find(e => e.id === evento_id);
          setEvento(eventoActual);
        }

        if (resTurno.data.success) {
          setMiTurno(resTurno.data.data);
        }
      } catch (error) {
        console.error("Error al inicializar:", error);
      } finally {
        setCargando(false);
      }
    };

    inicializarDatos();

    socket.connect();
    socket.emit("join_evento", evento_id);

    socket.on("turno_actual_cambiado", (data) => {
      setEvento(prev => prev ? { ...prev, turno_actual: data.turno_actual } : null);
      setMiTurno(prev => prev ? { ...prev, turno_actual: data.turno_actual } : null);
    });

    return () => {
      socket.emit("leave_evento", evento_id);
      socket.off("turno_actual_cambiado");
      socket.disconnect();
    };
  }, [evento_id]);

  const handleUnirseCola = async () => {
    setProcesando(true);
    try {
      const response = await api.post("/cola/registro", { evento_id });
      if (response.data.success) {
        const resTurno = await api.get(`/cola/mi-turno/${evento_id}`);
        setMiTurno(resTurno.data.data);
      }
    } catch (error) {
      alert(error.response?.data?.message || "Error al unirse a la fila.");
    } finally {
      setProcesando(false);
    }
  };

  const handleCancelarTurno = async () => {
    if (!window.confirm("¿Seguro que deseas abandonar tu lugar en la fila?")) return;
    setProcesando(true);
    try {
      await api.post("/cola/cancelar", { evento_id });
      setMiTurno(null); // Al limpiar el estado, el botón cambia automáticamente a "Unirse"
    } catch (error) {
      alert("Error al intentar cancelar tu turno.");
    } finally {
      setProcesando(false);
    }
  };

  if (cargando) return <p style={{ textAlign: "center", marginTop: "50px" }}>Cargando detalles...</p>;
  if (!evento) return <p style={{ textAlign: "center", marginTop: "50px" }}>Evento no disponible.</p>;

  const turnosRestantes = miTurno ? miTurno.numero_turno - (evento.turno_actual || 0) : null;

  return (
    <div className="detalle-page">
      <Navbar />
      <Breadcrumb/>
      <div className="detalle-container">
        <h1>Sala de Espera: {evento.nombre}</h1>
        
        {miTurno ? (
          <div className="ticket-alumno-container" style={{ border: "2px dashed #28a745", padding: "20px", borderRadius: "10px" }}>
            <h2>¡Ya estás en la fila!</h2>
            <p>Tu Turno: <strong>{miTurno.numero_turno}</strong></p>
            <p>Adelante: {turnosRestantes > 0 ? turnosRestantes : "¡Es tu turno!"}</p>
            <button className="btn-salir" disabled={procesando} onClick={handleCancelarTurno}>
              {procesando ? "Procesando..." : "Salir de la fila"}
            </button>
          </div>
        ) : (
          <button className="btn-unirse" disabled={procesando} onClick={handleUnirseCola}>
            {procesando ? "Uniendo..." : "Unirse a la Fila Ahora"}
          </button>
        )}
      </div>
      <Footer />
    </div>
  );
}