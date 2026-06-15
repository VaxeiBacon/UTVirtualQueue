// src/pages/admin/componentes/NavbarAdmin.jsx
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../../usuario/componentes/Navbar.css"; // Reutiliza el mismo CSS

export default function NavbarAdmin() {
  const navigate = useNavigate();
  const [admin, setAdmin] = useState(
    JSON.parse(localStorage.getItem("user") || "null")
  );

  useEffect(() => {
    const handleStorageChange = () => {
      setAdmin(JSON.parse(localStorage.getItem("user") || "null"));
    };
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/admin/login");
    window.location.reload();
  };

  return (
    <header className="navbar">
      <div className="navbar-brand">
        <Link to="/admin/dashboard" className="navbar-logo-link">
          <img src="/Logo UTSLRC PNG.png" alt="UTSLRC" className="navbar-logo" />
        </Link>
        <img src="/Logo BIS UTSLRC PNG.png" alt="UTSLRC" className="navbar-logo" />
        <div className="navbar-text">
          <h2>Sistema de Colas Virtuales</h2>
          <span>Panel Administrativo</span>
        </div>
      </div>

      <nav className="navbar-menu">
        <Link to="/admin/dashboard">Dashboard</Link>
        <Link to="/admin/eventos">Eventos</Link>
        <Link to="/admin/cola">Cola</Link>

        {/* Solo el admin principal ve la gestión de administradores */}
        {admin?.principal && (
          <Link to="/admin/administradores">Administradores</Link>
        )}

        <button className="logout-btn" onClick={handleLogout}>
          Cerrar Sesión
        </button>
      </nav>
    </header>
  );
}