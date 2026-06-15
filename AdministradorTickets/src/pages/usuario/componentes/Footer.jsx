import "./Footer.css";
import { Link } from "react-router-dom";
export default function Footer() {
  return (
    <footer className="footer">

      <div className="footer-container">

        <div className="footer-section">
          <h3>Fila en Línea</h3>
          <p>
            Sistema de gestión de eventos y filas en tiempo real para estudiantes.
          </p>
        </div>

        <div className="footer-section">
          <h4>Enlaces</h4>
          <ul>
            <li>        <Link to="/">
          Inicio
        </Link></li>
            <li>        <Link to="/eventos">
          Eventos
        </Link></li>
            <li>
                      <Link to="/mis-eventos">
          Mis Eventos
        </Link>
            </li>
            <li>        <Link to="/perfil">
          Perfil
        </Link></li>
          </ul>
        </div>

        <div className="footer-section">
          <h4>Soporte</h4>
          <ul>

            <li><Link to="/contacto">
          Contacto
        </Link></li>
            <li><Link to="/preguntas">
          Preguntas Frecuentes
        </Link></li>
          </ul>
        </div>

      </div>

      <div className="footer-bottom">
        <p>© {new Date().getFullYear()} Fila en Línea. Todos los derechos reservados.</p>
      </div>

    </footer>
  );
}