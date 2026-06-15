import "./Contacto.css";
import Navbar from "./componentes/Navbar";
import Footer from "./componentes/Footer";
import Breadcrumb from "../components/Breadcrumb";

const INFO_CONTACTO = [
  {
    id: "correo",
    titulo: "Correo electrónico",
    valor: "serviciostecnologicos@utslrc.edu.mx",
    enlace: "mailto:serviciostecnologicos@utslrc.edu.mx"
  },
  {
    id: "telefono",
    titulo: "Teléfono",
    valor: "653 518 5146 ext. 115 y 116",
    enlace: "tel:6535185146"
  },
  {
    id: "horario",
    titulo: "Horario de atención",
    valor: "Lunes a Viernes",
    detalle: "8:00 AM - 18:00 PM",
    enlace: null
  }
];

export default function Contacto() {
  return (
    <div className="contacto-page">
      <Navbar />
      <Breadcrumb />
      <div className="contacto-container">
        {/* HERO */}
        <div className="contacto-hero">
          <h1>Contacto</h1>
          <p>Estamos para ayudarte, comunícate con nosotros</p>
        </div>

        {/* INFO PRINCIPAL */}
        <div className="contacto-grid">
          {INFO_CONTACTO.map((info) => (
            <div className="contacto-card" key={info.id}>
              <h3>{info.titulo}</h3>
              
              {info.enlace ? (
                <a href={info.enlace} className="contacto-link">
                  {info.valor}
                </a>
              ) : (
                <p>{info.valor}</p>
              )}
              
              {info.detalle && <p className="contacto-detalle">{info.detalle}</p>}
            </div>
          ))}
        </div>
      </div>

      <Footer />
    </div>
  );
}