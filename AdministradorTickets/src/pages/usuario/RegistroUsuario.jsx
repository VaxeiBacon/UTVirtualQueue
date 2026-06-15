// src/pages/usuario/RegistroUsuario.jsx
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../../services/api";
import "./RegistroUsuario.css";
import Navbar from "./componentes/Navbar";
import Footer from "./componentes/Footer";
import Breadcrumb from "../components/Breadcrumb";

export default function RegistroUsuario() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    nombre: "",
    matricula: "",
    email: "",
    cuatrimestre: "",
    password: "",
    confirmarPassword: "",
  });
  const [procesando, setProcesando] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");

    if (
      !formData.nombre.trim() ||
      !formData.matricula.trim() ||
      !formData.email.trim() ||
      !formData.cuatrimestre ||
      !formData.password ||
      !formData.confirmarPassword
    ) {
      setErrorMsg("Por favor, complete todos los campos.");
      return;
    }

    // Validación básica de formato de correo
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setErrorMsg("Ingresa un correo electrónico válido.");
      return;
    }

    if (formData.password !== formData.confirmarPassword) {
      setErrorMsg("Las contraseñas no coinciden.");
      return;
    }

    if (formData.password.length < 6) {
      setErrorMsg("La contraseña debe tener al menos 6 caracteres.");
      return;
    }

    try {
      setProcesando(true);
      await api.post("/auth/registro", {
        nombre: formData.nombre,
        matricula: formData.matricula,
        email: formData.email,
        cuatrimestre: parseInt(formData.cuatrimestre, 10),
        password: formData.password,
      });

      alert("¡Cuenta creada correctamente! Ya puedes iniciar sesión.");
      navigate("/login");
    } catch (error) {
      console.error("Error al registrar:", error);
      console.log("Datos enviados ",nombre, matricula, email, cuatrimestre, password);  
      setErrorMsg(error.response?.data?.message || "Error al registrar usuario.");
    } finally {
      setProcesando(false);
    }
  };

  return (
    <div className="registro-page">
      <Navbar />
      <Breadcrumb/>
      <div className="registro-body">
        <div className="registro-card">
          <div className="registro-header">
            <h1>Crear cuenta</h1>
            <p>Regístrate para acceder al sistema de filas</p>
          </div>

          {errorMsg && <p className="error-alert">{errorMsg}</p>}

          <form className="registro-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Nombre Completo</label>
              <input
                type="text"
                name="nombre"
                value={formData.nombre}
                onChange={handleChange}
                placeholder="Ej. Juan García López"
              />
            </div>

            <div className="form-group">
              <label>Matrícula</label>
              <input
                type="text"
                name="matricula"
                value={formData.matricula}
                onChange={handleChange}
                placeholder="Ej. 23001234"
              />
            </div>

            <div className="form-group">
              <label>Correo electrónico</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Ej. juan@utslrc.edu.mx"
              />
            </div>

            <div className="form-group">
              <label>Cuatrimestre</label>
              <select
                name="cuatrimestre"
                value={formData.cuatrimestre}
                onChange={handleChange}
              >
                <option value="">Seleccione...</option>
                {[...Array(10)].map((_, i) => (
                  <option key={i + 1} value={i + 1}>
                    {i + 1}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Contraseña</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Mínimo 6 caracteres"
              />
            </div>

            <div className="form-group">
              <label>Confirmar Contraseña</label>
              <input
                type="password"
                name="confirmarPassword"
                value={formData.confirmarPassword}
                onChange={handleChange}
                placeholder="Repite tu contraseña"
              />
            </div>

            <button
              type="submit"
              className="btn-registrar"
              disabled={procesando}
            >
              {procesando ? "Registrando..." : "Crear cuenta"}
            </button>
          </form>

          <div className="login-separador">
            <span>¿Ya tienes cuenta?</span>
          </div>

          <Link to="/login" style={{ textDecoration: "none" }}>
            <button type="button" className="btn-login-outline">
              Iniciar sesión
            </button>
          </Link>
        </div>
      </div>
      <Footer />
    </div>
  );
}