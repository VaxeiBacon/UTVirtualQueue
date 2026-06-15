import "./DashboardAdmin.css";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import NavbarAdmin from "./componentes/NavbarAdmin";
import Breadcrumb from "../components/Breadcrumb";
import Footer from "../usuario/componentes/Footer";
import api from "../../services/api";

export default function DashboardAdmin() {
  const navigate = useNavigate();

  const [stats, setStats] = useState({
    activos: 0,
    pausados: 0,
    enCola: 0,
    atendidos: 0,
  });
  const [eventoPrincipal, setEventoPrincipal] = useState(null);
  const [cargando, setCargando] = useState(true);

  const adminLogueado = JSON.parse(localStorage.getItem("user") || "null");
  const token = localStorage.getItem("token");

  const cargarDatos = async () => {
    try {
      setCargando(true);
      const res = await api.get("/eventos/historicos", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const eventos = res.data.data || [];

      // Calcular stats
      const activos = eventos.filter((e) => e.estado === "ACTIVO").length;
      const pausados = eventos.filter((e) => e.estado === "PAUSADO").length;

      // Para personas en cola y atendidos necesitamos sumar de todos los eventos activos
      let enCola = 0;
      let atendidos = 0;

      for (const evento of eventos.filter(
        (e) => e.estado === "ACTIVO" || e.estado === "PAUSADO"
      )) {
        const resDetalle = await api.get(`/eventos/${evento.id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const detalle = resDetalle.data.data;
        if (detalle) {
          enCola += detalle.total_inscritos || 0;
          atendidos += detalle.turno_actual || 0;
        }
      }

      setStats({ activos, pausados, enCola, atendidos });

      // Evento principal: el activo con más inscritos
      const eventoActivo = eventos.find((e) => e.estado === "ACTIVO");
      if (eventoActivo) {
        const resDetalle = await api.get(`/eventos/${eventoActivo.id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setEventoPrincipal(resDetalle.data.data);
      }
    } catch (error) {
      console.error("Error al cargar datos del dashboard:", error);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    if (!token) {
      navigate("/admin/login");
      return;
    }
    cargarDatos();
  }, []);
  
  useEffect(() => {
  const user = JSON.parse(localStorage.getItem("user") || "null");
  if (!user || user.rol !== "ADMIN") {
    navigate("/Homepage");
  }
  }, []);

  const handleCerrarSesion = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/admin/login");
  };

  return (
    <div className="dashboard-page">
      <NavbarAdmin />
      <Breadcrumb/>
      <div className="dashboard-container">

        {/* HERO */}
        <div className="hero">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
            <div>
              <h1>Panel de Administración</h1>
              <p>
                Bienvenido,{" "}
                <strong>{adminLogueado?.nombre || "Administrador"}</strong>
                {adminLogueado?.principal ? " · Administrador Principal" : ""}
              </p>
            </div>
            <button
              onClick={handleCerrarSesion}
              style={{
                padding: "8px 16px",
                background: "transparent",
                border: "2px solid #205846",
                color: "#205846",
                borderRadius: "6px",
                cursor: "pointer",
                fontWeight: "600",
                fontSize: "0.85rem",
              }}
            >
              Cerrar sesión
            </button>
          </div>
        </div>

        {/* STATS */}
        <div className="stats-grid">
          <div className="stat-card">
            <h3>Eventos Activos</h3>
            <span>{cargando ? "..." : stats.activos}</span>
          </div>
          <div className="stat-card">
            <h3>Eventos Pausados</h3>
            <span>{cargando ? "..." : stats.pausados}</span>
          </div>
          <div className="stat-card">
            <h3>Personas en Cola</h3>
            <span>{cargando ? "..." : stats.enCola}</span>
          </div>
          <div className="stat-card">
            <h3>Turnos Atendidos</h3>
            <span>{cargando ? "..." : stats.atendidos}</span>
          </div>
        </div>

        {/* EVENTO PRINCIPAL */}
        <div className="evento-principal">
          <h2>Evento Principal</h2>

          {cargando ? (
            <div className="evento-card">
              <p style={{ color: "#888" }}>Cargando evento...</p>
            </div>
          ) : eventoPrincipal ? (
            <div className="evento-card">
              <h3>{eventoPrincipal.nombre}</h3>
              <p style={{ color: "#555", marginTop: "6px" }}>
                {eventoPrincipal.descripcion || "Sin descripción."}
              </p>
              <div className="evento-info">
                <span>
                  👥 {eventoPrincipal.total_inscritos} /{" "}
                  {eventoPrincipal.capacidad_maxima}
                </span>
                <span>🎟 Turno actual: {eventoPrincipal.turno_actual || 0}</span>
                <span>
                  {eventoPrincipal.estado === "ACTIVO" ? "🟢" : "🟡"}{" "}
                  {eventoPrincipal.estado}
                </span>
                <span>⏱ ~{eventoPrincipal.tiempo_espera_aprox} min/persona</span>
              </div>
              <button
                style={{
                  marginTop: "16px",
                  padding: "10px 20px",
                  background: "#205846",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontWeight: "600",
                }}
                onClick={() => navigate("/admin/cola")}
              >
                Gestionar Cola →
              </button>
            </div>
          ) : (
            <div className="evento-card">
              <p style={{ color: "#888" }}>No hay eventos activos en este momento.</p>
            </div>
          )}
        </div>

        {/* ACCESOS RÁPIDOS */}
        <div className="accesos-grid">
          <button
            className="acceso-card"
            onClick={() => navigate("/admin/eventos")}
          >
            📅 Eventos
          </button>
          <button
            className="acceso-card"
            onClick={() => navigate("/admin/cola")}
          >
            🎟 Cola en Vivo
          </button>
          {adminLogueado?.principal && (
            <button
              className="acceso-card"
              onClick={() => navigate("/admin/administradores")}
            >
              👤 Administradores
            </button>
          )}
        </div>

      </div>

      <Footer />
    </div>
  );
}