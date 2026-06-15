import { useState } from "react";
import "./Preguntas.css";
import Navbar from "./componentes/Navbar";
import Footer from "./componentes/Footer";
import Breadcrumb from "../components/Breadcrumb";
export default function Preguntas() {
  const [busqueda, setBusqueda] = useState("");

  // Lista estructurada de preguntas y respuestas
  const listaPreguntas = [
    {
      id: 1,
      pregunta: "¿Cómo me registro en un evento?",
      respuesta: "En la sección de eventos, selecciona el evento y presiona 'Ver detalles' para registrarte o unirte a la fila."
    },
    {
      id: 2,
      pregunta: "¿Cómo veo mi turno?",
      respuesta: "En la pantalla de 'Mis eventos', puedes ver el número de tu turno asignado, el estado actual y el avance de la fila."
    },
    {
      id: 3,
      pregunta: "¿Qué pasa si pierdo mi turno?",
      respuesta: "Si el administrador llama tu número y no te encuentras presente, tu turno cambiará de estado. Deberás volver a registrarte en la fila si el evento aún cuenta con cupos disponibles."
    },
    {
      id: 4,
      pregunta: "¿Puedo cancelar mi registro?",
      respuesta: "Sí, puedes hacerlo en cualquier momento antes de ser atendido desde la pantalla 'Mis eventos' presionando el botón 'Salir de fila'."
    },
    {
      id: 5,
      pregunta: "¿El sistema funciona en tiempo real?",
      respuesta: "Sí, mediante tecnología de WebSockets el número del turno que está siendo servido se actualiza automáticamente en tu pantalla sin necesidad de recargar."
    },
    {
      id: 6,
      pregunta: "¿Cómo contacto soporte?",
      respuesta: "Puedes acudir al departamento de servicios escolares o enviar un reporte utilizando tu correo institucional."
    }
  ];

  // Lógica de filtrado interactivo por coincidencia en pregunta o respuesta
  const preguntasFiltradas = listaPreguntas.filter((item) => {
    const termino = busqueda.toLowerCase();
    return (
      item.pregunta.toLowerCase().includes(termino) ||
      item.respuesta.toLowerCase().includes(termino)
    );
  });

  return (
    <div className="faq-page">
      <Navbar />
    <Breadcrumb/>
      <div className="faq-container">

        {/* HERO */}
        <div className="faq-hero">
          <h1>Preguntas frecuentes</h1>
          <p>Resuelve tus dudas sobre el sistema de filas en línea</p>
        </div>

        {/* BUSCADOR CONECTADO */}
        <div className="seccion-header">
          <h2>Buscar pregunta</h2>
          <input
            type="text"
            className="faq-search"
            placeholder="Escribe tu duda..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>

        {/* FAQ GRID DINÁMICO */}
        <div className="faq-grid">
          {preguntasFiltradas.length === 0 ? (
            <p className="no-data-msg" style={{ gridColumn: "1 / -1", textAlign: "center", margin: "20px" }}>
              No se encontraron preguntas que coincidan con tu búsqueda.
            </p>
          ) : (
            preguntasFiltradas.map((item) => (
              <div className="faq-card" key={item.id}>
                <h3>{item.pregunta}</h3>
                <p>{item.respuesta}</p>
              </div>
            ))
          )}
        </div>

      </div>

      <Footer />
    </div>
  );
}