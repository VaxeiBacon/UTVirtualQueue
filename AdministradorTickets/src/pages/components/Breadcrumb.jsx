// src/components/Breadcrumb.jsx
// Componente universal de breadcrumbs automáticos basado en la URL
import { Link, useLocation } from "react-router-dom";
import "./Breadcrumb.css";

// Mapa de nombres legibles para cada segmento de la URL
const NOMBRES = {
  // Usuario
  homepage: "Inicio",
  eventos: "Eventos",
  "mis-eventos": "Mis Eventos",
  perfil: "Perfil",
  contacto: "Contacto",
  preguntas: "Preguntas Frecuentes",
  login: "Iniciar Sesión",
  "reset-password": "Restablecer Contraseña",
  evento: "Detalle de Evento",

  // Admin
  admin: "Admin",
  dashboard: "Dashboard",
  cola: "Cola en Vivo",
  administradores: "Administradores",
  registro: "Registro",

  // Usuario dentro de /usuario
  usuario: "Cuenta",
};

export default function Breadcrumb() {
  const location = useLocation();

  // Divide la URL en segmentos ignorando vacíos
  const segmentos = location.pathname
    .split("/")
    .filter((seg) => seg !== "");

  // No mostrar breadcrumb en homepage o login
  const rutasOcultas = ["homepage", "login", "admin/login"];
  if (
    segmentos.length === 0 ||
    rutasOcultas.some((r) => location.pathname.toLowerCase().includes(r))
  ) {
    return null;
  }

  // Construir los items del breadcrumb
  const items = segmentos.map((seg, index) => {
    const path = "/" + segmentos.slice(0, index + 1).join("/");
    const esUUID =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        seg
      );

    // Si es un UUID, mostrar "Detalle" en lugar del UUID
    const nombre = esUUID
      ? "Detalle"
      : NOMBRES[seg.toLowerCase()] || seg.charAt(0).toUpperCase() + seg.slice(1);

    const esUltimo = index === segmentos.length - 1;

    return { path, nombre, esUltimo };
  });

  return (
    <nav className="breadcrumb-bar" aria-label="Ruta de navegación">
      <div className="breadcrumb-inner">
        {/* Siempre inicia con Inicio */}
        <Link to="/Homepage" className="breadcrumb-link">
          🏠 Inicio
        </Link>

        {items.map((item) => (
          <span key={item.path} className="breadcrumb-item">
            <span className="breadcrumb-sep">›</span>
            {item.esUltimo ? (
              <span className="breadcrumb-actual">{item.nombre}</span>
            ) : (
              <Link to={item.path} className="breadcrumb-link">
                {item.nombre}
              </Link>
            )}
          </span>
        ))}
      </div>
    </nav>
  );
}