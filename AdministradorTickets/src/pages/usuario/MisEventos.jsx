import "./MisEventos.css";
import { useState, useEffect, useRef } from "react";
import Navbar from "./componentes/Navbar";
import Footer from "./componentes/Footer";
import api from "../../services/api";
import Breadcrumb from "../components/Breadcrumb";
import { io } from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:3000";

export default function MisEventos() {
  const socketRef = useRef(null);

  const [misEventos, setMisEventos] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [loading, setLoading] = useState(true);

  const usuarioLogueado = JSON.parse(localStorage.getItem("user") || "null");
  const usuarioId = usuarioLogueado?.id || null;

  // ─── Cargar historial ─────────────────────────────────────────────────────
  const cargarHistorial = async () => {
    if (!usuarioId) return [];

    const token = localStorage.getItem("token");

    try {
      setLoading(true);
      const response = await api.get("/cola/mis-eventos", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data =
        response.data && Array.isArray(response.data.data)
          ? response.data.data
          : Array.isArray(response.data)
          ? response.data
          : [];

      setMisEventos(data);
      return data;
    } catch (error) {
      console.error("Error al obtener el historial de eventos:", error);
      if (
        error.response?.status === 401 ||
        error.response?.status === 403
      ) {
        alert("Tu sesión ha expirado. Por favor, vuelve a iniciar sesión.");
      }
      return [];
    } finally {
      setLoading(false);
    }
  };

  // ─── Carga inicial ────────────────────────────────────────────────────────
  useEffect(() => {
    cargarHistorial();
  }, [usuarioId]);

  // ─── WebSocket: conectar cuando tengamos eventos ──────────────────────────
  useEffect(() => {
    if (misEventos.length === 0) return;

    socketRef.current = io(SOCKET_URL);

    // Unirse a la sala de cada evento en el historial
    misEventos.forEach((item) => {
      if (item.evento_id) {
        socketRef.current.emit("join_evento", item.evento_id);
      }
    });

    // Escuchar cambio de turno actual (el que está siendo atendido)
    socketRef.current.on("turno_actual_cambiado", (data) => {
      setMisEventos((prev) =>
        prev.map((item) =>
          item.evento_id === data.evento_id
            ? { ...item, evento_turno_actual: data.turno_actual }
            : item
        )
      );
    });

    // Escuchar actualizaciones generales de la cola
    // (por si el admin avanza un turno y el alumno fue atendido)
    socketRef.current.on("actualizacion_cola", () => {
      cargarHistorial();
    });

    return () => {
      socketRef.current?.disconnect();
    };
  }, [misEventos.length]);

  // ─── Abandonar fila ───────────────────────────────────────────────────────
  const handleAbandonarFila = async (eventoId, nombreEvento) => {
    const confirmar = window.confirm(
      `¿Estás seguro de que deseas salir de la fila para: ${nombreEvento}?`
    );
    if (!confirmar) return;

    const token = localStorage.getItem("token");

    try {
      await api.post(
        "/cola/cancelar",
        { usuario_id: usuarioId, evento_id: eventoId },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Optimistic update: cambia estado local inmediatamente
      setMisEventos((prev) =>
        prev.map((item) =>
          (item.evento_id || item.id) === eventoId
            ? { ...item, mi_estado_turno: "CANCELADO" }
            : item
        )
      );

      alert("Has salido de la fila correctamente.");
      await cargarHistorial(); // Confirma con datos reales del servidor
    } catch (error) {
      console.error("Error al intentar abandonar la fila:", error);
      alert("No se pudo procesar la cancelación. Intenta de nuevo.");
    }
  };

  // ─── Filtro de búsqueda ───────────────────────────────────────────────────
  const eventosFiltrados = misEventos.filter((item) => {
    const termino = busqueda.toLowerCase();
    const nombre =
      item?.evento_nombre?.toLowerCase() ||
      item?.nombre?.toLowerCase() ||
      "";
    const descripcion =
      item?.evento_descripcion?.toLowerCase() ||
      item?.descripcion?.toLowerCase() ||
      "";
    return nombre.includes(termino) || descripcion.includes(termino);
  });

  // ─── Badge de estado ──────────────────────────────────────────────────────
  const obtenerClaseBadge = (estado) => {
    switch (estado?.toUpperCase()) {
      case "EN_COLA":
        return "badge-cola";
      case "ATENDIDO":
      case "CONFIRMADO":
        return "badge-confirmado";
      case "AUSENTE":
      case "FINALIZADO":
      case "CANCELADO":
        return "badge-finalizado";
      default:
        return "badge-default";
    }
  };

  // ─── Calcular personas por delante ───────────────────────────────────────
  const personasPorDelante = (item) => {
    const miTurno = item.numero_turno || 0;
    const turnoActual = item.evento_turno_actual || 0;
    const diferencia = miTurno - turnoActual - 1;
    return diferencia > 0 ? diferencia : 0;
  };

  // ─── Loading ──────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="loading-pantalla">
        Cargando tu historial de eventos...
      </div>
    );
  }

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="mis-eventos-page">
      <Navbar />
      <Breadcrumb />
      <div className="mis-eventos-container">
        <div className="hero">
          <h1>Historial de eventos</h1>
          <p>Consulta eventos a los que te registraste.</p>
        </div>

        <div className="seccion-header">
          <h2>Mis registros ({eventosFiltrados.length})</h2>
          <input
            className="header-busqueda"
            type="text"
            placeholder="Buscar por nombre de evento..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>

        <div className="mis-eventos-grid">
          {eventosFiltrados.length === 0 ? (
            <p className="no-data-msg">
              No tienes registros de eventos en este momento.
            </p>
          ) : (
            eventosFiltrados.map((item) => {
              // CORRECCIÓN: usa mi_estado_turno (campo real del SP sp_mis_eventos)
              const estadoTurno =
                item.mi_estado_turno || item.estado || "EN_COLA";
              const estaActivoEnCola = estadoTurno === "EN_COLA";
              const delante = personasPorDelante(item);

              return (
                <div
                  className="evento-card"
                  key={item.registro_id || item.id || Math.random()}
                >
                  <span className={obtenerClaseBadge(estadoTurno)}>
                    {estadoTurno.replace("_", " ")}
                  </span>

                  <h3>{item.evento_nombre || item.nombre}</h3>
                  <p>
                    {item.evento_descripcion ||
                      item.descripcion ||
                      "Sin descripción adicional."}
                  </p>

                  <div className="evento-info">
                    {estaActivoEnCola ? (
                      <>
                        <span>
                          🎫 Tu turno:{" "}
                          <b>{item.numero_turno || "Asignando..."}</b>
                        </span>
                        <span>
                          🔔 Turno actual:{" "}
                          {/* Se actualiza en tiempo real por WebSocket */}
                          <b>{item.evento_turno_actual || 0}</b>
                        </span>
                        <span>
                          ⏳ Personas por delante: <b>{delante}</b>
                        </span>
                      </>
                    ) : (
                      <span>
                        ✔️ Estatus:{" "}
                        {estadoTurno.toLowerCase().replace("_", " ")}
                      </span>
                    )}
                  </div>

                  <div className="botones">
                    <button
                      className="btn-secundario"
                      onClick={() =>
                        alert(
                          `Turno: #${item.numero_turno || item.turno}\nEstado: ${estadoTurno}`
                        )
                      }
                    >
                      Ver detalle
                    </button>

                    {estaActivoEnCola && (
                      <button
                        className="btn-salir"
                        onClick={() =>
                          handleAbandonarFila(
                            item.evento_id || item.id,
                            item.evento_nombre || item.nombre
                          )
                        }
                      >
                        Salir de fila
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
}