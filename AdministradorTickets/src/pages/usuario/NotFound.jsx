// src/pages/usuario/NotFound.jsx
import { useNavigate } from "react-router-dom";
import Navbar from "./componentes/Navbar";
import Footer from "./componentes/Footer";
import "./NotFound.css";

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="notfound-page">
      <Navbar />

      <div className="notfound-container">
        <div className="notfound-code">404</div>

        <div className="notfound-divider" />

        <h1 className="notfound-titulo">Página no encontrada</h1>
        <p className="notfound-descripcion">
          La página que buscas no existe o fue movida.
        </p>

        <div className="notfound-acciones">
          <button
            className="notfound-btn-principal"
            onClick={() => navigate("/Homepage")}
          >
             Ir al inicio
          </button>
          <button
            className="notfound-btn-secundario"
            onClick={() => navigate(-1)}
          >
            ← Volver atrás
          </button>
        </div>
      </div>

      <Footer />
    </div>
  );
}