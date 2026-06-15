import { useState, useEffect, useRef } from "react";
import "./Eventos.css";
import Navbar from "./componentes/Navbar";
import Footer from "./componentes/Footer";
import api from "../../services/api";
import { useNavigate } from "react-router-dom";
import Breadcrumb from "../components/Breadcrumb";
import { io } from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:5003";

export default function Eventos() {
  const navigate = useNavigate();
  const socketRef = useRef(null);

  const [eventos, setEventos] = useState([]);
  const [misInscripciones, setMisInscripciones] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [eventoModal, setEventoModal] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [procesandoRegistro, setProcesandoRegistro] = useState(false);

  const token = localStorage.getItem("token");

  // ─── Carga inicial de datos ───────────────────────────────────────────────
  const obtenerEventos = async () => {
    try {
      setCargando(true);

      // Eventos siempre se cargan, estés logueado o no
      const resEventos = await api.get("/eventos/activos");
      const eventosData = resEventos.data.data || resEventos.data;
      setEventos(eventosData);

      // Mis inscripciones solo si hay token
      if (token) {
        try {
          const resMisInscripciones = await api.get("/cola/mis-eventos", {
            headers: { Authorization: `Bearer ${token}` },
          });
          setMisInscripciones(resMisInscripciones.data.data || []);
        } catch {
          // Si falla (token expirado, etc.) simplemente no mostramos inscripciones
          setMisInscripciones([]);
        }
      }

      return eventosData;
    } catch (error) {
      console.error("Error al cargar eventos:", error);
      return [];
    } finally {
      setCargando(false);
    }
  };

  // ─── Carga inicial ────────────────────────────────────────────────────────
  useEffect(() => {
    obtenerEventos();
  }, []);

  // ─── WebSocket: conectar cuando tengamos eventos ──────────────────────────
  useEffect(() => {
    if (eventos.length === 0) return;

    socketRef.current = io(SOCKET_URL);

    eventos.forEach((evento) => {
      socketRef.current.emit("join_evento", evento.id);
    });

    socketRef.current.on("turno_actual_cambiado", (data) => {
      setEventos((prev) =>
        prev.map((evt) =>
          evt.id === data.evento_id
            ? { ...evt, turno_actual: data.turno_actual }
            : evt
        )
      );
      setEventoModal((prev) =>
        prev?.id === data.evento_id
          ? { ...prev, turno_actual: data.turno_actual }
          : prev
      );
    });

    socketRef.current.on("actualizacion_cola", () => {
      if (!token) return;
      api
        .get("/cola/mis-eventos", {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then((res) => setMisInscripciones(res.data.data || []))
        .catch(console.error);
    });

    return () => {
      socketRef.current?.disconnect();
    };
  }, [eventos.length]);

  // ─── Ver detalles ─────────────────────────────────────────────────────────
  const handleVerDetalles = async (id) => {
    try {
      const res = await api.get(`/eventos/${id}`);
      setEventoModal(res.data.data || res.data);
    } catch (err) {
      alert("No se pudieron cargar los detalles.");
    }
  };

  // ─── Inscribirse ──────────────────────────────────────────────────────────
  const handleInscribirse = async (eventoId) => {
    if (!token) {
      alert("Debes iniciar sesión para unirte a la fila.");
      navigate("/login");
      return;
    }

    setProcesandoRegistro(true);
    try {
      await api.post(
        "/cola/registro",
        { evento_id: eventoId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert("¡Te has unido a la fila con éxito!");
      setEventoModal(null);
      await obtenerEventos();
    } catch (error) {
      alert(error.response?.data?.message || "Error al inscribirse.");
    } finally {
      setProcesandoRegistro(false);
    }
  };

  // ─── Cancelar ─────────────────────────────────────────────────────────────
  const handleCancelar = async (eventoId) => {
    try {
      await api.post(
        "/cola/cancelar",
        { evento_id: eventoId },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setMisInscripciones((prev) =>
        prev.map((i) =>
          i.evento_id === eventoId ? { ...i, mi_estado_turno: "CANCELADO" } : i
        )
      );

      alert("Has salido de la fila con éxito.");
      setEventoModal(null);
      await obtenerEventos();
    } catch (error) {
      alert("Error al intentar salir de la fila.");
    }
  };

  // ─── Helpers ──────────────────────────────────────────────────────────────
  const eventosFiltrados = Array.isArray(eventos)
    ? eventos.filter((evt) =>
        evt?.nombre?.toLowerCase().includes(busqueda.toLowerCase())
      )
    : [];

  const formatearFecha = (fechaString) => {
    if (!fechaString) return "";
    return new Date(fechaString).toLocaleDateString("es-MX", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const yaEstoyInscrito = misInscripciones.some(
    (i) => i.evento_id === eventoModal?.id && i.mi_estado_turno === "EN_COLA"
  );

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="eventos-page">
      <Navbar />
      <Breadcrumb />

      <div className="home-container">
        <div className="hero">
          <h1>Eventos disponibles</h1>
          <p>Consulta eventos disponibles y únete a la fila en tiempo real</p>
        </div>

        <div className="seccion-header">
          <h2>Buscar eventos</h2>
          <input
            className="header-busqueda"
            type="text"
            placeholder="Buscar evento..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>

        {cargando && (
          <p style={{ textAlign: "center", margin: "20px" }}>
            Cargando eventos disponibles...
          </p>
        )}
        {!cargando && eventosFiltrados.length === 0 && (
          <p style={{ textAlign: "center", margin: "20px" }}>
            No se encontraron eventos activos en este momento.
          </p>
        )}

        <div className="eventos-grid">
          {eventosFiltrados.map((evento) => (
            <div className="evento-card" key={evento.id || Math.random()}>
              <span className="badge-activo">{evento.estado || "ACTIVO"}</span>
              <h3>{evento.nombre}</h3>
              <p>{evento.descripcion || "Sin descripción disponible."}</p>

              <div className="evento-info">
                <span>📅 Fecha de inicio {formatearFecha(evento.fecha_inicio)}</span>
                <span>
                  👥 Total inscritos {evento.total_inscritos} /{" "}
                  {evento.capacidad_maxima}
                </span>
              </div>

              <div className="turno-actual">
                <span>Turno actual sirviendo</span>
                <p className="actual">{evento.turno_actual || 0}</p>
              </div>

              <button
                className="btn-ver"
                onClick={() => handleVerDetalles(evento.id)}
              >
                Ver detalles
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* ─── Modal ──────────────────────────────────────────────────────── */}
      {eventoModal && (
        <div className="modal-overlay" onClick={() => setEventoModal(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Detalles del evento</h2>
            <h3>{eventoModal.nombre}</h3>

            <div className="modal-info">
              <p><b>Fecha de Inicio:</b> {formatearFecha(eventoModal.fecha_inicio)}</p>
              <p><b>Cupos Máximos:</b> {eventoModal.capacidad_maxima}</p>
              <p><b>Total Registrados:</b> {eventoModal.total_inscritos || 0}</p>
              <p><b>Estado:</b> {eventoModal.estado || "Activo"}</p>
              <p><b>Turno actual:</b> {eventoModal.turno_actual || 0}</p>
            </div>

            <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
              {token ? (
                yaEstoyInscrito ? (
                  <>
                    <p style={{ color: "#2E7D32", fontWeight: "bold", margin: 0, alignSelf: "center" }}>
                      ✓ Ya estás en la fila.
                    </p>
                    <button
                      className="btn-cerrar"
                      style={{ backgroundColor: "#dc3545", color: "white" }}
                      onClick={() => handleCancelar(eventoModal.id)}
                    >
                      Salir de la fila
                    </button>
                  </>
                ) : (
                  <button
                    className="btn-ver"
                    style={{
                      backgroundColor: "#28a745",
                      color: "white",
                      cursor: procesandoRegistro ? "not-allowed" : "pointer",
                      opacity: procesandoRegistro ? 0.7 : 1,
                    }}
                    disabled={procesandoRegistro}
                    onClick={() => handleInscribirse(eventoModal.id)}
                  >
                    {procesandoRegistro ? "Inscribiendo..." : "Unirse a la Fila Ahora"}
                  </button>
                )
              ) : (
                // Usuario no logueado — invitar a iniciar sesión
                <button
                  className="btn-ver"
                  style={{ backgroundColor: "#205846", color: "white" }}
                  onClick={() => navigate("/login")}
                >
                  Inicia sesión para unirte
                </button>
              )}

              <button
                className="btn-cerrar"
                style={{ margin: 0 }}
                onClick={() => setEventoModal(null)}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}