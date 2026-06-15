import "./Perfil.css";
import { useState, useEffect } from "react";
import Navbar from "./componentes/Navbar";
import Breadcrumb from "../components/Breadcrumb";
import Footer from "./componentes/Footer";
import api from "../../services/api";

export default function Perfil() {
  const [actividadReciente, setActividadReciente] = useState([]);
  const [cargandoActividad, setCargandoActividad] = useState(true);

  // Recuperar los datos reales del alumno desde el localStorage
  const usuarioLogueado = JSON.parse(localStorage.getItem("user") || "null");
  
  const nombreCompleto = usuarioLogueado?.nombre || "Usuario no identificado";
  const carrera = usuarioLogueado?.carrera || "Carrera no especificada";

  const matricula = usuarioLogueado?.matricula || "Sin matrícula";
  const cuatrimestre = usuarioLogueado?.cuatrimestre || "N/A";

  // Función para obtener de forma dinámica las iniciales del nombre para el avatar
  const obtenerIniciales = (nombre) => {
    if (!nombre || nombre === "Usuario no identificado") return "U";
    const partes = nombre.trim().split(" ");
    if (partes.length >= 2) {
      return (partes[0][0] + partes[1][0]).toUpperCase();
    }
    return partes[0][0].toUpperCase();
  };

  useEffect(() => {
    const cargarActividad = async () => {
      if (!usuarioLogueado?.id) {
        setCargandoActividad(false);
        return;
      }

      const token = localStorage.getItem("token");

      try {
        // Consultamos los eventos reales del alumno para extraer la actividad reciente
        const response = await api.get("/cola/mis-eventos", {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        if (response.data && Array.isArray(response.data.data)) {
          // Tomamos únicamente los últimos 3 eventos registrados para la lista corta
          setActividadReciente(response.data.data.slice(0, 3));
        } else if (Array.isArray(response.data)) {
          setActividadReciente(response.data.slice(0, 3));
        }
      } catch (error) {
        console.error("Error al cargar la actividad reciente en perfil:", error);
      } finally {
        setCargandoActividad(false);
      }
    };

    cargarActividad();
  }, []);

  return (
    <div className="perfil-page">
      <Navbar />
      <Breadcrumb />
      <div className="perfil-container">

        {/* HERO */}
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
            <h3>Información personal</h3>
            <p><b>Matrícula:</b> {matricula}</p>
            <p><b>Cuatrimestre:</b> {cuatrimestre}</p>
          </div>

          <div className="perfil-card">
            <h3>Actividad reciente</h3>
            {cargandoActividad ? (
              <p>Cargando actividad...</p>
            ) : actividadReciente.length === 0 ? (
              <p>No registras actividad reciente en ninguna fila.</p>
            ) : (
              <ul>
                {actividadReciente.map((item) => (
                  <li key={item.registro_id || item.id || Math.random()}>
                    {item.evento_nombre || item.nombre} - 
                    <span className="texto-estado"> {item.mi_estado_turno || item.estado || "EN_COLA"}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

        </div>

        {/* ACCIONES */}
        <div className="perfil-actions">
          <button onClick={() => alert("Función en desarrollo por la administración de la universidad.")}>
            Cambiar contraseña
          </button>
        </div>

      </div>

      <Footer />
    </div>
  );
}