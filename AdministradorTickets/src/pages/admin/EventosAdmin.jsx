// src/pages/admin/EventosAdmin.jsx
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "./EventosAdmin.css";
import { io } from "socket.io-client";
import NavbarAdmin from "./componentes/NavbarAdmin";
import Breadcrumb from "../components/Breadcrumb";
import Footer from "../usuario/componentes/Footer";
import api from "../../services/api";

const estadoInicial = {
  nombre: "",
  descripcion: "",
  fechaInicio: "",
  fechaFin: "",
  capacidad: "",
  tiempoEspera: "",
};

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:5003";

// Componente contador reutilizable
function InputConContador({ value, onChange, maxLength, style, ...props }) {
  return (
    <div style={{ position: "relative" }}>
      <input
        value={value}
        onChange={onChange}
        maxLength={maxLength}
        style={{ paddingRight: "55px", ...style }}
        {...props}
      />
      <span style={{
        position: "absolute",
        right: "10px",
        top: "50%",
        transform: "translateY(-50%)",
        fontSize: "0.75rem",
        color: value.length >= maxLength ? "#c0392b" : "#aaa",
        fontWeight: value.length >= maxLength ? "700" : "400",
        pointerEvents: "none",
      }}>
        {value.length}/{maxLength}
      </span>
    </div>
  );
}

function TextareaConContador({ value, onChange, maxLength, ...props }) {
  return (
    <div style={{ position: "relative" }}>
      <textarea
        value={value}
        onChange={onChange}
        maxLength={maxLength}
        style={{ paddingBottom: "25px" }}
        {...props}
      />
      <span style={{
        position: "absolute",
        right: "10px",
        bottom: "8px",
        fontSize: "0.75rem",
        color: value.length >= maxLength ? "#c0392b" : "#aaa",
        fontWeight: value.length >= maxLength ? "700" : "400",
        pointerEvents: "none",
      }}>
        {value.length}/{maxLength}
      </span>
    </div>
  );
}

export default function EventosAdmin() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const socketRef = useRef(null);

  const [eventos, setEventos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [filtro, setFiltro] = useState("ACTIVO");
  const [busqueda, setBusqueda] = useState("");

  const [mostrarModal, setMostrarModal] = useState(false);
  const [modoEdicion, setModoEdicion] = useState(false);
  const [eventoEditandoId, setEventoEditandoId] = useState(null);
  const [form, setForm] = useState(estadoInicial);
  const [errorForm, setErrorForm] = useState("");
  const [procesando, setProcesando] = useState(false);

  const cargarEventos = async () => {
    try {
      setCargando(true);
      const res = await api.get("/eventos/historicos", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setEventos(res.data.data || []);
    } catch (error) {
      console.error("Error al cargar eventos:", error);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user") || "null");
    if (!token || !user || user.rol !== "ADMIN") {
      navigate("/Homepage");
      return;
    }
    cargarEventos();
  }, []);

  useEffect(() => {
    if (eventos.length === 0) return;

    if (socketRef.current) socketRef.current.disconnect();

    socketRef.current = io(SOCKET_URL);

    socketRef.current.on("connect", () => {
      eventos.forEach((ev) => {
        socketRef.current.emit("join_evento", ev.id);
      });
    });

    socketRef.current.on("turno_actual_cambiado", (data) => {
      setEventos((prev) =>
        prev.map((ev) =>
          ev.id === data.evento_id
            ? { ...ev, turno_actual: data.turno_actual }
            : ev
        )
      );
    });

    socketRef.current.on("actualizacion_cola", () => {
      cargarEventos();
    });

    return () => {
      socketRef.current?.disconnect();
    };
  }, [eventos.length]);

  const eventosFiltrados = eventos.filter((e) => {
    const coincideEstado = e.estado === filtro;
    const coincideBusqueda = e.nombre?.toLowerCase().includes(busqueda.toLowerCase());
    return coincideEstado && coincideBusqueda;
  });

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const abrirModalCrear = () => {
    setForm(estadoInicial);
    setErrorForm("");
    setModoEdicion(false);
    setEventoEditandoId(null);
    setMostrarModal(true);
  };

  const abrirModalEditar = (evento) => {
    setForm({
      nombre: evento.nombre || "",
      descripcion: evento.descripcion || "",
      fechaInicio: evento.fecha_inicio
        ? new Date(evento.fecha_inicio).toISOString().slice(0, 16)
        : "",
      fechaFin: evento.fecha_fin
        ? new Date(evento.fecha_fin).toISOString().slice(0, 16)
        : "",
      capacidad: evento.capacidad_maxima || "",
      tiempoEspera: evento.tiempo_espera_aprox || "",
    });
    setErrorForm("");
    setModoEdicion(true);
    setEventoEditandoId(evento.id);
    setMostrarModal(true);
  };

  const cerrarModal = () => {
    setMostrarModal(false);
    setErrorForm("");
  };

  const validarForm = () => {
    if (!form.nombre.trim()) return "Debes ingresar un nombre.";
    if (form.nombre.length > 50) return "El nombre no puede superar 50 caracteres.";
    if (!form.descripcion.trim()) return "Debes ingresar una descripción.";
    if (form.descripcion.length > 200) return "La descripción no puede superar 200 caracteres.";
    if (!form.fechaInicio) return "Debes seleccionar la fecha de inicio.";
    if (!form.fechaFin) return "Debes seleccionar la fecha de finalización.";
    if (!modoEdicion && new Date(form.fechaInicio) <= new Date())
      return "La fecha de inicio debe ser posterior al momento actual.";
    if (new Date(form.fechaFin) <= new Date(form.fechaInicio))
      return "La fecha de finalización debe ser posterior a la de inicio.";
    if (!form.capacidad || Number(form.capacidad) <= 0)
      return "La capacidad máxima debe ser mayor a 0.";
    if (String(form.capacidad).length > 5)
      return "La capacidad máxima no puede superar 5 dígitos.";
    if (!form.tiempoEspera || Number(form.tiempoEspera) <= 0)
      return "El tiempo de espera debe ser mayor a 0.";
    if (String(form.tiempoEspera).length > 3)
      return "El tiempo de espera no puede superar 3 dígitos.";
    return null;
  };

  const handleCrear = async () => {
    const error = validarForm();
    if (error) { setErrorForm(error); return; }
    try {
      setProcesando(true);
      await api.post("/eventos", {
        nombre: form.nombre,
        descripcion: form.descripcion,
        fecha_inicio: form.fechaInicio,
        fecha_fin: form.fechaFin,
        capacidad_maxima: Number(form.capacidad),
        tiempo_espera_aprox: Number(form.tiempoEspera),
      }, { headers: { Authorization: `Bearer ${token}` } });
      alert("¡Evento creado correctamente!");
      cerrarModal();
      cargarEventos();
    } catch (error) {
      setErrorForm(error.response?.data?.message || "Error al crear el evento.");
    } finally {
      setProcesando(false);
    }
  };

  const handleEditar = async () => {
    const error = validarForm();
    if (error) { setErrorForm(error); return; }
    try {
      setProcesando(true);
      await api.put(`/eventos/${eventoEditandoId}`, {
        nombre: form.nombre,
        descripcion: form.descripcion,
        fecha_inicio: form.fechaInicio,
        fecha_fin: form.fechaFin,
        capacidad_maxima: Number(form.capacidad),
      }, { headers: { Authorization: `Bearer ${token}` } });
      alert("Evento actualizado correctamente.");
      cerrarModal();
      cargarEventos();
    } catch (error) {
      setErrorForm(error.response?.data?.message || "Error al actualizar el evento.");
    } finally {
      setProcesando(false);
    }
  };

  const handleCambiarEstado = async (eventoId, nuevoEstado) => {
    if (!window.confirm(`¿Confirmas cambiar el estado a "${nuevoEstado}"?`)) return;
    try {
      await api.patch(`/eventos/${eventoId}/estado`,
        { estado: nuevoEstado },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      cargarEventos();
    } catch (error) {
      alert(error.response?.data?.message || "Error al cambiar el estado.");
    }
  };

  const getBadgeClass = (estado) => {
    switch (estado) {
      case "ACTIVO": return "badge-activo";
      case "PAUSADO": return "badge-pausado";
      case "FINALIZADO":
      case "CANCELADO": return "badge-finalizado";
      default: return "badge-activo";
    }
  };

  const formatearFecha = (fechaString) => {
    if (!fechaString) return "";
    return new Date(fechaString).toLocaleDateString("es-MX", {
      day: "2-digit", month: "2-digit", year: "numeric",
    });
  };

  return (
    <div className="eventos-admin-page">
      <NavbarAdmin />
      <Breadcrumb />
      <div className="home-container">

        <div className="hero">
          <h1>Administración de Eventos</h1>
          <p>Gestiona eventos, colas y registros del sistema</p>
        </div>

        <div className="seccion-header">
          <h2>Eventos</h2>
          <button className="btn-crear" onClick={abrirModalCrear}>+ Crear Evento</button>
        </div>

        <div className="filtros">
          {["ACTIVO", "PAUSADO", "FINALIZADO", "CANCELADO"].map((estado) => (
            <button
              key={estado}
              className={filtro === estado ? "activo" : ""}
              onClick={() => setFiltro(estado)}
            >
              {estado.charAt(0) + estado.slice(1).toLowerCase()}
            </button>
          ))}
        </div>

        <input
          className="header-busqueda"
          type="text"
          placeholder="Buscar evento..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />

        {cargando ? (
          <p style={{ textAlign: "center", color: "#888" }}>Cargando eventos...</p>
        ) : eventosFiltrados.length === 0 ? (
          <p style={{ textAlign: "center", color: "#888" }}>No hay eventos con estado "{filtro}".</p>
        ) : (
          <div className="eventos-grid">
            {eventosFiltrados.map((evento) => (
              <div key={evento.id} className="evento-card">
                <span className={getBadgeClass(evento.estado)}>{evento.estado}</span>
                <h3>{evento.nombre}</h3>
                <p style={{ color: "#555", margin: "8px 0" }}>{evento.descripcion || "Sin descripción."}</p>
                <div className="evento-info">
                  <span>📅 {formatearFecha(evento.fecha_inicio)}</span>
                  <span>👥 {evento.turno_actual || 0} / {evento.capacidad_maxima}</span>
                </div>
                <div className="turno-actual">
                  <span>Turno actual sirviendo</span>
                  <p className="actual">{evento.turno_actual || 0}</p>
                </div>
                <div className="acciones-evento">
                  <button className="btn-cola" onClick={() => navigate(`/admin/cola?evento=${evento.id}`)}>Ver Cola</button>
                  <button className="btn-editar" onClick={() => abrirModalEditar(evento)}>Editar</button>
                </div>
                <div style={{ display: "flex", gap: "6px", marginTop: "10px", flexWrap: "wrap" }}>
                  {evento.estado !== "ACTIVO" && (
                    <button onClick={() => handleCambiarEstado(evento.id, "ACTIVO")}
                      style={{ flex: 1, padding: "8px", background: "#2E7D32", color: "white", border: "none", cursor: "pointer", fontSize: "0.8rem" }}>
                      ▶ Activar
                    </button>
                  )}
                  {evento.estado === "ACTIVO" && (
                    <button onClick={() => handleCambiarEstado(evento.id, "PAUSADO")}
                      style={{ flex: 1, padding: "8px", background: "#EF6C00", color: "white", border: "none", cursor: "pointer", fontSize: "0.8rem" }}>
                      ⏸ Pausar
                    </button>
                  )}
                  {(evento.estado === "ACTIVO" || evento.estado === "PAUSADO") && (
                    <button onClick={() => handleCambiarEstado(evento.id, "FINALIZADO")}
                      style={{ flex: 1, padding: "8px", background: "#546E7A", color: "white", border: "none", cursor: "pointer", fontSize: "0.8rem" }}>
                      ✓ Finalizar
                    </button>
                  )}
                  {evento.estado !== "CANCELADO" && evento.estado !== "FINALIZADO" && (
                    <button onClick={() => handleCambiarEstado(evento.id, "CANCELADO")}
                      style={{ flex: 1, padding: "8px", background: "#c0392b", color: "white", border: "none", cursor: "pointer", fontSize: "0.8rem" }}>
                      ✕ Cancelar
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ─── Modal ────────────────────────────────────────────────────────── */}
      {mostrarModal && (
        <div className="modal-overlay" onClick={cerrarModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>{modoEdicion ? "Editar Evento" : "Crear Evento"}</h2>

            <div className="form-group">
              <label>Nombre del evento <span style={{ color: "#aaa", fontSize: "0.8rem" }}>(máx. 50)</span></label>
              <InputConContador
                type="text"
                name="nombre"
                value={form.nombre}
                maxLength={50}
                onChange={handleFormChange}
                placeholder="Ej. Inscripciones Enero 2028 (Max 50 caracteres)"
              />
            </div>

            <div className="form-group">
              <label>Descripción <span style={{ color: "#aaa", fontSize: "0.8rem" }}>(máx. 200)</span></label>
              <TextareaConContador
                name="descripcion"
                rows="3"
                value={form.descripcion}
                maxLength={200}
                onChange={handleFormChange}
                placeholder="Describe brevemente el evento... (Max. 200 caracteres)"
              />
            </div>

            <div className="form-group">
              <label>Fecha y hora de inicio</label>
              <input
                type="datetime-local"
                name="fechaInicio"
                min={new Date().toISOString().slice(0, 16)}
                value={form.fechaInicio}
                onChange={(e) => {
                  handleFormChange(e);
                  if (form.fechaFin && new Date(form.fechaFin) <= new Date(e.target.value)) {
                    setForm((prev) => ({ ...prev, fechaFin: "" }));
                  }
                }}
              />
            </div>

            <div className="form-group">
              <label>Fecha y hora de finalización</label>
              <input
                type="datetime-local"
                name="fechaFin"
                min={form.fechaInicio || new Date().toISOString().slice(0, 16)}
                value={form.fechaFin}
                onChange={handleFormChange}
                disabled={!form.fechaInicio}
              />
            </div>

            <div className="form-group">
              <label>Capacidad máxima <span style={{ color: "#aaa", fontSize: "0.8rem" }}>(máx. 5 dígitos)</span></label>
              <input
                type="number"
                name="capacidad"
                min="1"
                max="99999"
                value={form.capacidad}
                onChange={(e) => {
                  if (e.target.value.length <= 5) handleFormChange(e);
                }}
              />
            </div>

            <div className="form-group">
              <label>Tiempo de espera aproximado (min) <span style={{ color: "#aaa", fontSize: "0.8rem" }}>(máx. 3 dígitos)</span></label>
              <input
                type="number"
                name="tiempoEspera"
                min="1"
                max="999"
                value={form.tiempoEspera}
                placeholder="3 digitos maximo"
                onChange={(e) => {
                  if (e.target.value.length <= 3) handleFormChange(e);
                }}
              />
            </div>

            {errorForm && (
              <p style={{ color: "#c0392b", background: "#fdecea", padding: "10px", borderRadius: "4px", marginBottom: "12px", fontSize: "0.875rem" }}>
                {errorForm}
              </p>
            )}

            <div style={{ display: "flex", gap: "10px" }}>
              <button className="btn-guardar" disabled={procesando} onClick={modoEdicion ? handleEditar : handleCrear}>
                {procesando ? "Guardando..." : modoEdicion ? "Guardar Cambios" : "Crear Evento"}
              </button>
              <button onClick={cerrarModal}
                style={{ padding: "12px 20px", background: "transparent", border: "2px solid #205846", color: "#205846", cursor: "pointer", fontWeight: "bold" }}>
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}