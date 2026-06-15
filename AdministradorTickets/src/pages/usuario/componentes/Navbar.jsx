import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./Navbar.css";

export default function Navbar() {
  const navigate = useNavigate();
  // Obtenemos token y el objeto user para validar roles
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [user, setUser] = useState(JSON.parse(localStorage.getItem("user") || "null"));

  // Detectamos si es administrador
  const isAdmin = user?.rol === "ADMIN";

  useEffect(() => {
    const handleStorageChange = () => {
      setToken(localStorage.getItem("token"));
      setUser(JSON.parse(localStorage.getItem("user") || "null"));
    };
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setToken(null);
    setUser(null);
    navigate("/Homepage");
    window.location.reload();
  };

  return (
    <header className="navbar">
      <div className="navbar-brand">
        <Link to="/Homepage" className="navbar-logo-link">
          <img src="/Logo UTSLRC PNG.png" alt="UTSLRC" className="navbar-logo" />
        </Link>
        <img src="/Logo BIS UTSLRC PNG.png" alt="UTSLRC" className="navbar-logo" />
        <div className="navbar-text">
          <h2>Sistema de Colas Virtuales</h2>
          <span>Universidad Tecnológica de San Luis Río Colorado</span>
        </div>
      </div>

      <nav className="navbar-menu">
        <Link to="/Homepage">Inicio</Link>
        <Link to="/eventos">Eventos</Link>

        {/* Links específicos solo para usuarios normales */}
        {token && !isAdmin && (
          <>
            <Link to="/mis-eventos">Mis Eventos</Link>
            <Link to="/perfil">Perfil</Link>
          </>
        )}

        {token ? (
          isAdmin ? (
            // Botón especial para que el admin pueda volver a su panel
            <Link to="/admin/dashboard" className="btn-admin-nav">
              Volver al Dashboard
            </Link>
          ) : (
            // Botón de cerrar sesión solo para alumnos
            <button className="logout-btn" onClick={handleLogout}>
              Cerrar Sesión
            </button>
          )
        ) : (
          <Link to="/login" className="login-btn-nav">
            Iniciar Sesión
          </Link>
        )}
      </nav>
    </header>
  );
}