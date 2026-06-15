// src/pages/admin/ColaAdmin.jsx
import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { io } from "socket.io-client";
import "./ColaAdmin.css";
import NavbarAdmin from "./componentes/NavbarAdmin";
import Breadcrumb from "../components/Breadcrumb";
import Footer from "../usuario/componentes/Footer";
import api from "../../services/api";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:3000";

export default function ColaAdmin() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = localStorage.getItem("token");
  const socketRef = useRef(null);
  const autoSkipRef = useRef(null);

  // ─── Estado del evento ────────────────────────────────────────────────────
  const [eventos, setEventos] = useState([]);
  const [eventoSeleccionado, setEventoSeleccionado] = useState(null);
  const [turnoActual, setTurnoActual] = useState(0);

  // ─── Estado de la cola ────────────────────────────────────────────────────
  const [cola, setCola] = useState([]);
  const [cargando, setCargando] = useState(true);

  // ─── Auto skip ────────────────────────────────────────────────────────────
  const [autoSkipActivo, setAutoSkipActivo] = useState(false);
  const [timer, setTimer] = useState(5);
  const [tiempoRestante, setTiempoRestante] = useState(5 * 60);

  // ─── Tiempo de espera aprox ───────────────────────────────────────────────
  const [tiempoEspera, setTiempoEspera] = useState(5);
  const [procesando, setProcesando] = useState(false);

  // ─── Cargar eventos activos/pausados para el selector ────────────────────
  const cargarEventos = async () => {
    try {
      const res = await api.get("/eventos/historicos", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const todos = res.data.data || [];
      const activos = todos.filter(
        (e) => e.estado === "ACTIVO" || e.estado === "PAUSADO"
      );
      setEventos(activos);

      // Si viene evento por query param (?evento=ID), seleccionarlo
      const eventoIdParam = searchParams.get("evento");
      if (eventoIdParam) {
        const encontrado = activos.find((e) => e.id === eventoIdParam);
        if (encontrado) seleccionarEvento(encontrado);
      } else if (activos.length > 0) {
        seleccionarEvento(activos[0]);
      }
    } catch (error) {
      console.error("Error al cargar eventos:", error);
    }
  };

  // ─── Seleccionar evento y cargar su cola ─────────────────────────────────
  const seleccionarEvento = async (evento) => {
    setEventoSeleccionado(evento);
    setTurnoActual(evento.turno_actual || 0);
    setTiempoEspera(evento.tiempo_espera_aprox || 5);
    await cargarCola(evento.id);
  };

  const cargarCola = async (eventoId) => {
    try {
      setCargando(true);
      const res = await api.get(`/cola/en-vivo/${eventoId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCola(res.data.data || []);
    } catch (error) {
      console.error("Error al cargar cola:", error);
    } finally {
      setCargando(false);
    }
  };

  // ─── Efectos ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!token) { navigate("/admin/login"); return; }
    cargarEventos();
  }, []);

  useEffect(() => {
  const user = JSON.parse(localStorage.getItem("user") || "null");
  if (!user || user.rol !== "ADMIN") {
    navigate("/Homepage");
  }
  }, []);

  // WebSocket
  useEffect(() => {
    if (!eventoSeleccionado) return;

    socketRef.current = io(SOCKET_URL);
  
    socketRef.current.on("connect", () => {
  console.log("Socket conectado:", socketRef.current.id);
  console.log("Uniéndose a sala:", eventoSeleccionado.id);
  socketRef.current.emit("join_evento", eventoSeleccionado.id);
    });
    
    socketRef.current.emit("join_evento", eventoSeleccionado.id);

    socketRef.current.on("actualizacion_cola", (data) => {
      setCola(data);
    });

    socketRef.current.on("turno_actual_cambiado", (data) => {
      if (data.evento_id === eventoSeleccionado.id) {
        setTurnoActual(data.turno_actual);
      }
    });

    return () => {
      socketRef.current?.disconnect();
    };
  }, [eventoSeleccionado?.id]);

  // Auto skip countdown
  useEffect(() => {
    if (autoSkipRef.current) clearInterval(autoSkipRef.current);
    if (!autoSkipActivo || !eventoSeleccionado) return;

    setTiempoRestante(timer * 60);

    autoSkipRef.current = setInterval(() => {
      setTiempoRestante((prev) => {
        if (prev <= 1) {
          handleSiguienteTurno();
          return timer * 60;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(autoSkipRef.current);
  }, [autoSkipActivo, timer, eventoSeleccionado?.id]);

  // ─── Acciones de turno ────────────────────────────────────────────────────
  const handleSiguienteTurno = async () => {
    if (!eventoSeleccionado) return;
    try {
      await api.post(
        "/cola/avanzar-turno",
        { evento_id: eventoSeleccionado.id },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      // El WebSocket actualiza la UI automáticamente
    } catch (error) {
      alert(error.response?.data?.message || "Error al avanzar el turno.");
    }
  };

  const handleSaltarTurno = async (numeroTurno) => {
    if (!eventoSeleccionado) return;
    try {
      await api.post(
        "/cola/skipear-turno",
        { evento_id: eventoSeleccionado.id, numero_turno: numeroTurno },
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch (error) {
      alert(error.response?.data?.message || "Error al saltar el turno.");
    }
  };

  // ─── Cambiar estado del evento ────────────────────────────────────────────
  const handleCambiarEstado = async (nuevoEstado) => {
    if (!eventoSeleccionado) return;
    try {
      await api.patch(
        `/eventos/${eventoSeleccionado.id}/estado`,
        { estado: nuevoEstado },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setEventoSeleccionado((prev) => ({ ...prev, estado: nuevoEstado }));
    } catch (error) {
      alert("Error al cambiar el estado del evento.");
    }
  };

  // ─── Actualizar tiempo de espera ──────────────────────────────────────────
  const handleActualizarTiempoEspera = async () => {
    if (!eventoSeleccionado) return;
    try {
      setProcesando(true);
      // Emitir por socket para que llegue en tiempo real a todos
      socketRef.current?.emit("cambiar_tiempo_espera", {
        eventoId: eventoSeleccionado.id,
        nuevoTiempo: tiempoEspera,
      });
      alert("Tiempo de espera actualizado.");
    } catch (error) {
      alert("Error al actualizar el tiempo de espera.");
    } finally {
      setProcesando(false);
    }
  };

  // ─── Formato tiempo ───────────────────────────────────────────────────────
  const formatTiempo = (segundos) => {
    const m = String(Math.floor(segundos / 60)).padStart(2, "0");
    const s = String(segundos % 60).padStart(2, "0");
    return `${m}:${s}`;
  };

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="cola-page">
      <NavbarAdmin />
      <Breadcrumb />

      <div className="cola-container">

        <div className="hero">
          <h1>Administrar Cola</h1>
          <p>Control de turnos en tiempo real</p>
        </div>

        {/* Selector de evento */}
        {eventos.length > 1 && (
          <div style={{ marginBottom: "20px" }}>
            <label style={{ fontWeight: "600", color: "#205846", marginRight: "10px" }}>
              Evento:
            </label>
            <select
              value={eventoSeleccionado?.id || ""}
              onChange={(e) => {
                const ev = eventos.find((ev) => ev.id === e.target.value);
                if (ev) seleccionarEvento(ev);
              }}
              style={{ padding: "10px", border: "1px solid #ccc", borderRadius: "4px", fontSize: "0.95rem" }}
            >
              {eventos.map((ev) => (
                <option key={ev.id} value={ev.id}>{ev.nombre}</option>
              ))}
            </select>
          </div>
        )}

        {/* Info del evento */}
        {eventoSeleccionado ? (
          <>
            <div className="evento-card">
              <h2>{eventoSeleccionado.nombre}</h2>
              <div className="evento-info">
                <span>👥 {cola.length} en cola</span>
                <span>🎟 Turno actual: {turnoActual}</span>
                <span>
                  {eventoSeleccionado.estado === "ACTIVO" ? "🟢" : "🟡"}{" "}
                  {eventoSeleccionado.estado}
                </span>
              </div>
            </div>

            {/* Turno actual grande */}
            <div className="turno-actual-card">
              <span>Turno siendo atendido</span>
              <h1>{turnoActual}</h1>
            </div>

            {/* Controles */}
            <div className="controles-grid">
              <button className="btn-control" onClick={handleSiguienteTurno}>
                ➡ Siguiente turno
              </button>

              {eventoSeleccionado.estado === "ACTIVO" ? (
                <button
                  className="btn-control"
                  style={{ background: "#EF6C00" }}
                  onClick={() => handleCambiarEstado("PAUSADO")}
                >
                  ⏸ Pausar cola
                </button>
              ) : (
                <button
                  className="btn-control"
                  style={{ background: "#2E7D32" }}
                  onClick={() => handleCambiarEstado("ACTIVO")}
                >
                  ▶ Reanudar cola
                </button>
              )}

              <button
                className="btn-control"
                style={{ background: "#546E7A" }}
                onClick={() => {
                  if (window.confirm("¿Finalizar este evento?"))
                    handleCambiarEstado("FINALIZADO");
                }}
              >
                ✓ Finalizar evento
              </button>

              <button
                className="btn-control"
                style={{ background: "#c0392b" }}
                onClick={() => {
                  if (window.confirm("¿Cancelar este evento?"))
                    handleCambiarEstado("CANCELADO");
                }}
              >
                ✕ Cancelar evento
              </button>
            </div>

            {/* Timer y auto skip */}
            <div className="timer-grid">
              <div className="timer-card">
                <h3>Auto Skip</h3>
                <div className="autoskip-config">
                  <input
                    type="checkbox"
                    checked={autoSkipActivo}
                    onChange={() => setAutoSkipActivo(!autoSkipActivo)}
                  />
                  <span>Activar auto skip</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <input
                    type="number"
                    min="1"
                    value={timer}
                    disabled={!autoSkipActivo}
                    onChange={(e) => {
                      const t = Number(e.target.value);
                      setTimer(t);
                      setTiempoRestante(t * 60);
                    }}
                  />
                  <span>minutos</span>
                </div>
              </div>

              <div className="timer-card">
                <h3>Tiempo restante</h3>
                <div className="contador-turno">
                  <span>{formatTiempo(tiempoRestante)}</span>
                </div>
              </div>
            </div>

            {/* Tiempo de espera aprox */}
            <div className="timer-card" style={{ marginBottom: "25px" }}>
              <h3>Tiempo de espera aproximado</h3>
              <p style={{ color: "#666", fontSize: "0.85rem", margin: "6px 0 12px" }}>
                Este valor se muestra a los alumnos en la sala de espera.
              </p>
              <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                <input
                  type="number"
                  min="1"
                  value={tiempoEspera}
                  onChange={(e) => setTiempoEspera(Number(e.target.value))}
                />
                <span>minutos/persona</span>
                <button
                  className="btn-control"
                  style={{ padding: "10px 16px" }}
                  disabled={procesando}
                  onClick={handleActualizarTiempoEspera}
                >
                  Actualizar
                </button>
              </div>
            </div>

            {/* Cola en vivo */}
            <div className="seccion-header">
              <h2>Turnos en cola ({cola.length})</h2>
            </div>

            {cargando ? (
              <p style={{ color: "#888", textAlign: "center" }}>Cargando cola...</p>
            ) : cola.length === 0 ? (
              <p style={{ color: "#888", textAlign: "center" }}>No hay alumnos en cola.</p>
            ) : (
              <div className="cola-lista">
                {cola.map((persona) => (
                  <div
                    key={persona.registro_id}
                    className={
                      persona.numero_turno === turnoActual
                        ? "turno-card actual"
                        : "turno-card"
                    }
                  >
                    <div>
                      <h3>Turno #{persona.numero_turno}</h3>
                      <p style={{ margin: "4px 0" }}>
                        <strong>{persona.alumno_nombre}</strong>
                      </p>
                      <p style={{ fontSize: "0.85rem", color: "#666" }}>
                        {persona.alumno_matricula} · {persona.alumno_cuatrimestre}° cuatrimestre
                      </p>
                    </div>

                    <div className="acciones-turno">
                      {persona.numero_turno === turnoActual && (
                        <button onClick={handleSiguienteTurno}>
                          ✓ Atendido
                        </button>
                      )}
                      <button
                        style={{ background: "#EF6C00" }}
                        onClick={() => handleSaltarTurno(persona.numero_turno)}
                      >
                        ⏭ Saltar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          <div style={{ textAlign: "center", padding: "40px", color: "#888" }}>
            No hay eventos activos o pausados en este momento.
          </div>
        )}

      </div>

      <Footer />
    </div>
  );
}