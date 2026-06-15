import { Link } from "react-router-dom";
import "./NavbarLoginAdmin.css";

export default function NavbarLoginAdmin() {
  return (
    <header className="navbar-admin-login">
      <div className="navbar-admin-brand">
        <img src="/Logo UTSLRC PNG.png" alt="UTSLRC" className="nav-admin-logo" />
        <div className="nav-admin-text">
          <h3>Sistema de Colas Virtuales</h3>
          <p>Panel Administrativo</p>
        </div>
      </div>
      
      {/* Añadimos el botón de navegación */}
      <nav className="navbar-admin-menu">
        <Link to="/Homepage" className="btn-volver-inicio">
          ← Volver al Inicio
        </Link>
      </nav>
    </header>
  );
}