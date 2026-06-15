// src/pages/usuario/LoginUsuario.jsx
import "./LoginUsuario.css";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import Navbar from "./componentes/Navbar";
import Breadcrumb from "../components/Breadcrumb";
import Footer from "./componentes/Footer";
import api from "../../services/api";

export default function Login() {
  const navigate = useNavigate();
  const [matricula, setMatricula] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMsg("");

    if (!matricula || !password) {
      setErrorMsg("Por favor, completa todos los campos.");
      return;
    }

    try {
      const response = await api.post("/auth/login/usuario", {
        matricula,
        password,
      });

      if (response.data.success) {
        localStorage.setItem("token", response.data.token);
        localStorage.setItem("user", JSON.stringify(response.data.user));
        navigate("/eventos");
      }
    } catch (error) {
      const mensaje =
        error.response?.data?.message || "Error al conectar con el servidor.";
      setErrorMsg(mensaje);
    }
  };

  return (
    <div className="login-page">
      <Navbar />
      <Breadcrumb />
      <div className="login-body">
        <div className="login-card">
          <h1>Iniciar sesión</h1>
          <p>Accede al sistema de filas en línea</p>

          {errorMsg && (
            <p className="error-alert">{errorMsg}</p>
          )}

          <form onSubmit={handleLogin}>
            <label>Matrícula</label>
            <input
              type="text"
              value={matricula}
              onChange={(e) => setMatricula(e.target.value)}
              placeholder="Ingresa tu matrícula (ej. 20260001)"
            />

            <label>Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />

            <button type="submit">Entrar</button>

            <Link to="/reset-password" className="login-link-texto">
              Olvidé mi contraseña
            </Link>

            <Link to="/admin/login" className="login-link-texto">
              Soy administrativo
            </Link>
          </form>
        </div>
      </div>
      <Footer />
    </div>
  );
}