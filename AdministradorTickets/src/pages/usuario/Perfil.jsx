import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./Perfil.css";

import Navbar from "./componentes/Navbar";
import Breadcrumb from "../components/Breadcrumb";
import Footer from "./componentes/Footer";
import api from "../../services/api";

export default function Perfil() {
  const navigate = useNavigate();

  // Estados
  const [actividadReciente, setActividadReciente] = useState([]);
  const [cargandoActividad, setCargandoActividad] = useState(true);
  
  // Modal cambiar contraseña
  const [mostrarModalPassword, setMostrarModalPassword] = useState(false);
  const [passwordActual, setPasswordActual] = useState("");
  const [nuevaPassword, setNuevaPassword] = useState("");
  const [confirmarPassword, setConfirmarPassword] = useState("");
  const [errorPassword, setErrorPassword] = useState("");
  const [procesandoPassword, setProcesandoPassword] = useState(false);

  // Datos de usuario
  const usuarioLogueado = JSON.parse(localStorage.getItem("user") || "null");
  const token = localStorage.getItem("token");
  const nombreCompleto = usuarioLogueado?.nombre || "Usuario no identificado";
  const carrera = usuarioLogueado?.carrera || "Carrera no especificada";
  const matricula = usuarioLogueado?.matricula || "Sin matrícula";
  const cuatrimestre = usuarioLogueado?.cuatrimestre || "N/A";

  const obtenerIniciales = (nombre) => {
    if (!nombre || nombre === "Usuario no identificado") return "U";
    const partes = nombre.trim().split(" ");
    return partes.length >= 2
      ? (partes[0][0] + partes[1][0]).toUpperCase()
      : partes[0][0].toUpperCase();
  };

  useEffect(() => {
    if (!usuarioLogueado?.id) {
      navigate("/login");
      return;
    }

    const cargarActividad = async () => {
      try {
        const response = await api.get("/cola/mis-eventos", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = response.data?.data || response.data || [];
        setActividadReciente(Array.isArray(data) ? data.slice(0, 3) : []);
      } catch (error) {
        console.error("Error al cargar actividad:", error);
      } finally {
        setCargandoActividad(false);
      }
    };

    cargarActividad();
  }, []);

  // ─── Cambiar contraseña ───────────────────────────────────────────────────
  const handleCambiarPassword = async () => {
    setErrorPassword("");

    if (!passwordActual || !nuevaPassword || !confirmarPassword) {
      setErrorPassword("Completa todos los campos.");
      return;
    }
    if (nuevaPassword.length < 6) {
      setErrorPassword("La nueva contraseña debe tener al menos 6 caracteres.");
      return;
    }
    if (nuevaPassword !== confirmarPassword) {
      setErrorPassword("Las contraseñas no coinciden.");
      return;
    }
    if (nuevaPassword === passwordActual) {
      setErrorPassword("La nueva contraseña debe ser diferente a la actual.");
      return;
    }

    try {
      setProcesandoPassword(true);

      // Verificamos la contraseña actual haciendo login
      await api.post("/auth/login/usuario", {
        matricula,
        password: passwordActual,
      });

      // Si el login es exitoso, procedemos a cambiar
      await api.post("/reset/cambiar-password-autenticado", {
        matricula,
        nuevaPassword,
      });

      alert("✅ Contraseña actualizada correctamente.");
      setMostrarModalPassword(false);
      setPasswordActual("");
      setNuevaPassword("");
      setConfirmarPassword("");
    } catch (error) {
      if (error.response?.status === 401) {
        setErrorPassword("La contraseña actual es incorrecta.");
      } else {
        setErrorPassword(error.response?.data?.message || "Error al cambiar la contraseña.");
      }
    } finally {
      setProcesandoPassword(false);
    }
  };

  const obtenerColorEstado = (estado) => {
    switch (estado?.toUpperCase()) {
      case "EN_COLA": return "#1565C0";
      case "ATENDIDO": return "#2E7D32";
      case "CANCELADO": return "#757575";
      case "AUSENTE": return "#EF6C00";
      default: return "#555";
    }
  };

  return (
    <div className="perfil-page">
      <Navbar />
      <Breadcrumb />

      <div className="perfil-container">
        <div className="hero">
          <h1>Mi perfil</h1>
          <p>Gestiona tu información académica y consulta tu actividad en el sistema.</p>
        </div>

        {/* HEADER PERFIL */}
        <div className="perfil-card">
          <div className="perfil-avatar">
            <span>{obtenerIniciales(nombreCompleto)}</span>
          </div>
          <div className="perfil-grid">
            <h1>{nombreCompleto}</h1>
            <p>{carrera}</p>
          </div>
        </div>

        {/* INFO PRINCIPAL */}
        <div className="perfil-grid">
          <div className="perfil-card">
            <h3>Información académica</h3>
            <p><b>Matrícula:</b> {matricula}</p>
            <p><b>Cuatrimestre:</b> {cuatrimestre}</p>
            <p><b>Carrera:</b> {carrera}</p>
          </div>

          <div className="perfil-card">
            <h3>Actividad reciente</h3>
            {cargandoActividad ? (
              <p>Cargando actividad...</p>
            ) : actividadReciente.length === 0 ? (
              <p>No registras actividad reciente en ninguna fila.</p>
            ) : (
              <ul style={{ paddingLeft: "16px" }}>
                {actividadReciente.map((item) => {
                  const estado = item.mi_estado_turno || item.estado || "EN_COLA";
                  return (
                    <li key={item.registro_id || item.id || Math.random()} style={{ marginBottom: "8px" }}>
                      {item.evento_nombre || item.nombre}
                      <span style={{ color: obtenerColorEstado(estado), fontWeight: "600", marginLeft: "6px" }}>
                        · {estado.replace("_", " ")}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>

        {/* ACCIONES */}
        <div className="perfil-actions">
          <button onClick={() => setMostrarModalPassword(true)}>
            🔒 Cambiar contraseña
          </button>
        </div>
      </div>

      {/* ─── Modal cambiar contraseña ────────────────────────────────────── */}
      {mostrarModalPassword && (
        <div className="modal-overlay" onClick={() => setMostrarModalPassword(false)}>
          <div className="modal-password" onClick={(e) => e.stopPropagation()}>
            <h2>Cambiar contraseña</h2>
            
            <div className="form-group">
              <label>Contraseña actual</label>
              <input
                type="password"
                placeholder="Ingresa tu contraseña actual"
                value={passwordActual}
                onChange={(e) => setPasswordActual(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Nueva contraseña</label>
              <input
                type="password"
                placeholder="Mínimo 6 caracteres"
                value={nuevaPassword}
                onChange={(e) => setNuevaPassword(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Confirmar nueva contraseña</label>
              <input
                type="password"
                placeholder="Repite la nueva contraseña"
                value={confirmarPassword}
                onChange={(e) => setConfirmarPassword(e.target.value)}
              />
            </div>

            {errorPassword && (
              <p style={{ color: "#c0392b", background: "#fdecea", padding: "10px", borderRadius: "4px", fontSize: "0.875rem" }}>
                {errorPassword}
              </p>
            )}

            <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
              <button
                onClick={() => { setMostrarModalPassword(false); setErrorPassword(""); }}
                style={{ flex: 1, padding: "12px", background: "transparent", border: "2px solid #ccc", color: "#555", borderRadius: "4px", cursor: "pointer", fontWeight: "600" }}
              >
                Cancelar
              </button>
              <button
                onClick={handleCambiarPassword}
                disabled={procesandoPassword}
                style={{ flex: 1, padding: "12px", background: "#205846", color: "white", border: "none", borderRadius: "4px", cursor: "pointer", fontWeight: "600", opacity: procesandoPassword ? 0.7 : 1 }}
              >
                {procesandoPassword ? "Guardando..." : "Guardar cambios"}
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}