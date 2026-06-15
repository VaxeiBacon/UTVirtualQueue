// src/pages/admin/EventosAdmin.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./EventosAdmin.css";
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

export default function EventosAdmin() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const [eventos, setEventos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [filtro, setFiltro] = useState("ACTIVO");
  const [busqueda, setBusqueda] = useState("");

  // Modal crear/editar
  const [mostrarModal, setMostrarModal] = useState(false);
  const [modoEdicion, setModoEdicion] = useState(false);
  const [eventoEditandoId, setEventoEditandoId] = useState(null);
  const [form, setForm] = useState(estadoInicial);
  const [errorForm, setErrorForm] = useState("");
  const [procesando, setProcesando] = useState(false);

  // ─── Cargar eventos ───────────────────────────────────────────────────────
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
    if (!token) { navigate("/admin/login"); return; }
    cargarEventos();
  }, []);

  useEffect(() => {
  const user = JSON.parse(localStorage.getItem("user") || "null");
  if (!user || user.rol !== "ADMIN") {
    navigate("/Homepage");
  }
}, []);

  // ─── Filtrar ──────────────────────────────────────────────────────────────
  const eventosFiltrados = eventos.filter((e) => {
    const coincideEstado = e.estado === filtro;
    const coincideBusqueda = e.nombre
      ?.toLowerCase()
      .includes(busqueda.toLowerCase());
    return coincideEstado && coincideBusqueda;
  });

  // ─── Helpers form ─────────────────────────────────────────────────────────
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

  // ─── Validar form ─────────────────────────────────────────────────────────
  const validarForm = () => {
    if (!form.nombre.trim()) return "Debes ingresar un nombre.";
    if (!form.descripcion.trim()) return "Debes ingresar una descripción.";
    if (!form.fechaInicio) return "Debes seleccionar la fecha de inicio.";
    if (!form.fechaFin) return "Debes seleccionar la fecha de finalización.";
    if (!modoEdicion && new Date(form.fechaInicio) <= new Date())
      return "La fecha de inicio debe ser posterior al momento actual.";
    if (new Date(form.fechaFin) <= new Date(form.fechaInicio))
      return "La fecha de finalización debe ser posterior a la de inicio.";
    if (!form.capacidad || Number(form.capacidad) <= 0)
      return "La capacidad máxima debe ser mayor a 0.";
    if (!form.tiempoEspera || Number(form.tiempoEspera) <= 0)
      return "El tiempo de espera debe ser mayor a 0.";
    return null;
  };

  // ─── Crear evento ─────────────────────────────────────────────────────────
  const handleCrear = async () => {
    const error = validarForm();
    if (error) { setErrorForm(error); return; }

    try {
      setProcesando(true);
      await api.post(
        "/eventos",
        {
          nombre: form.nombre,
          descripcion: form.descripcion,
          fecha_inicio: form.fechaInicio,
          fecha_fin: form.fechaFin,
          capacidad_maxima: Number(form.capacidad),
          tiempo_espera_aprox: Number(form.tiempoEspera),
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert("¡Evento creado correctamente!");
      cerrarModal();
      cargarEventos();
    } catch (error) {
      setErrorForm(error.response?.data?.message || "Error al crear el evento.");
    } finally {
      setProcesando(false);
    }
  };

  // ─── Editar evento ────────────────────────────────────────────────────────
  const handleEditar = async () => {
    const error = validarForm();
    if (error) { setErrorForm(error); return; }

    try {
      setProcesando(true);
      await api.put(
        `/eventos/${eventoEditandoId}`,
        {
          nombre: form.nombre,
          descripcion: form.descripcion,
          fecha_inicio: form.fechaInicio,
          fecha_fin: form.fechaFin,
          capacidad_maxima: Number(form.capacidad),
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert("Evento actualizado correctamente.");
      cerrarModal();
      cargarEventos();
    } catch (error) {
      setErrorForm(error.response?.data?.message || "Error al actualizar el evento.");
    } finally {
      setProcesando(false);
    }
  };

  // ─── Cambiar estado ───────────────────────────────────────────────────────
  const handleCambiarEstado = async (eventoId, nuevoEstado) => {
    const confirmar = window.confirm(
      `¿Confirmas cambiar el estado a "${nuevoEstado}"?`
    );
    if (!confirmar) return;

    try {
      await api.patch(
        `/eventos/${eventoId}/estado`,
        { estado: nuevoEstado },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      cargarEventos();
    } catch (error) {
      alert(error.response?.data?.message || "Error al cambiar el estado.");
    }
  };

  // ─── Badge ────────────────────────────────────────────────────────────────
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

  // ─── Render ───────────────────────────────────────────────────────────────
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
          <button className="btn-crear" onClick={abrirModalCrear}>
            + Crear Evento
          </button>
        </div>

        {/* Filtros por estado */}
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

        {/* Búsqueda */}
        <input
          className="header-busqueda"
          type="text"
          placeholder="Buscar evento..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />

        {/* Grid de eventos */}
        {cargando ? (
          <p style={{ textAlign: "center", color: "#888" }}>Cargando eventos...</p>
        ) : eventosFiltrados.length === 0 ? (
          <p style={{ textAlign: "center", color: "#888" }}>
            No hay eventos con estado "{filtro}".
          </p>
        ) : (
          <div className="eventos-grid">
            {eventosFiltrados.map((evento) => (
              <div key={evento.id} className="evento-card">
                <span className={getBadgeClass(evento.estado)}>
                  {evento.estado}
                </span>

                <h3>{evento.nombre}</h3>
                <p style={{ color: "#555", margin: "8px 0" }}>
                  {evento.descripcion || "Sin descripción."}
                </p>

                <div className="evento-info">
                  <span>📅 {formatearFecha(evento.fecha_inicio)}</span>
                  <span>👥 {evento.turno_actual || 0} / {evento.capacidad_maxima}</span>
                </div>

                <div className="turno-actual">
                  <span>Turno actual sirviendo</span>
                  <p className="actual">{evento.turno_actual || 0}</p>
                </div>

                {/* Acciones */}
                <div className="acciones-evento">
                  <button
                    className="btn-cola"
                    onClick={() => navigate(`/admin/cola?evento=${evento.id}`)}
                  >
                    Ver Cola
                  </button>
                  <button
                    className="btn-editar"
                    onClick={() => abrirModalEditar(evento)}
                  >
                    Editar
                  </button>
                </div>

                {/* Cambiar estado */}
                <div style={{ display: "flex", gap: "6px", marginTop: "10px", flexWrap: "wrap" }}>
                  {evento.estado !== "ACTIVO" && (
                    <button
                      onClick={() => handleCambiarEstado(evento.id, "ACTIVO")}
                      style={{ flex: 1, padding: "8px", background: "#2E7D32", color: "white", border: "none", cursor: "pointer", fontSize: "0.8rem" }}
                    >
                      ▶ Activar
                    </button>
                  )}
                  {evento.estado === "ACTIVO" && (
                    <button
                      onClick={() => handleCambiarEstado(evento.id, "PAUSADO")}
                      style={{ flex: 1, padding: "8px", background: "#EF6C00", color: "white", border: "none", cursor: "pointer", fontSize: "0.8rem" }}
                    >
                      ⏸ Pausar
                    </button>
                  )}
                  {(evento.estado === "ACTIVO" || evento.estado === "PAUSADO") && (
                    <button
                      onClick={() => handleCambiarEstado(evento.id, "FINALIZADO")}
                      style={{ flex: 1, padding: "8px", background: "#546E7A", color: "white", border: "none", cursor: "pointer", fontSize: "0.8rem" }}
                    >
                      ✓ Finalizar
                    </button>
                  )}
                  {evento.estado !== "CANCELADO" && evento.estado !== "FINALIZADO" && (
                    <button
                      onClick={() => handleCambiarEstado(evento.id, "CANCELADO")}
                      style={{ flex: 1, padding: "8px", background: "#c0392b", color: "white", border: "none", cursor: "pointer", fontSize: "0.8rem" }}
                    >
                      ✕ Cancelar
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ─── Modal Crear / Editar ──────────────────────────────────────────── */}
      {mostrarModal && (
        <div className="modal-overlay" onClick={cerrarModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>{modoEdicion ? "Editar Evento" : "Crear Evento"}</h2>

            <div className="form-group">
              <label>Nombre del evento</label>
              <input
                type="text"
                name="nombre"
                value={form.nombre}
                onChange={handleFormChange}
                placeholder="Ej. Inscripciones Enero 2028"
              />
            </div>

            <div className="form-group">
              <label>Descripción</label>
              <textarea
                name="descripcion"
                rows="3"
                value={form.descripcion}
                onChange={handleFormChange}
                placeholder="Describe brevemente el evento..."
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
              <label>Capacidad máxima</label>
              <input
                type="number"
                name="capacidad"
                min="1"
                value={form.capacidad}
                onChange={handleFormChange}
              />
            </div>

            <div className="form-group">
              <label>Tiempo de espera aproximado (minutos)</label>
              <input
                type="number"
                name="tiempoEspera"
                min="1"
                value={form.tiempoEspera}
                onChange={handleFormChange}
              />
            </div>

            {errorForm && (
              <p style={{ color: "#c0392b", background: "#fdecea", padding: "10px", borderRadius: "4px", marginBottom: "12px", fontSize: "0.875rem" }}>
                {errorForm}
              </p>
            )}

            <div style={{ display: "flex", gap: "10px" }}>
              <button
                className="btn-guardar"
                disabled={procesando}
                onClick={modoEdicion ? handleEditar : handleCrear}
              >
                {procesando ? "Guardando..." : modoEdicion ? "Guardar Cambios" : "Crear Evento"}
              </button>
              <button
                onClick={cerrarModal}
                style={{ padding: "12px 20px", background: "transparent", border: "2px solid #205846", color: "#205846", cursor: "pointer", fontWeight: "bold" }}
              >
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