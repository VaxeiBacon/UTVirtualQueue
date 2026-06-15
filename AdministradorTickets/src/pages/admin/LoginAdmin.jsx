// src/pages/admin/LoginAdmin.jsx
import "./LoginAdmin.css";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../usuario/componentes/Navbar";
import Breadcrumb from "../components/Breadcrumb";
import api from "../../services/api";

export default function LoginAdmin() {
  const navigate = useNavigate();
  const [matricula, setMatricula] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [procesando, setProcesando] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMsg("");

    if (!matricula || !password) {
      setErrorMsg("Por favor, completa todos los campos.");
      return;
    }

    try {
      setProcesando(true);
      const response = await api.post("/auth/login/admin", {
        matricula,
        password,
      });

      if (response.data.success) {
        localStorage.setItem("token", response.data.token);
        localStorage.setItem("user", JSON.stringify(response.data.user));
        navigate("/admin/dashboard");
      }
    } catch (error) {
      const mensaje =
        error.response?.data?.message || "Error al conectar con el servidor.";
      setErrorMsg(mensaje);
    } finally {
      setProcesando(false);
    }
  };

  return (
    <div className="login-page">
    <Navbar/>
    <Breadcrumb />
      <div className="login-card">

        <div className="login-header">
          <img src="/logo-utslrc.png" alt="UTSLRC" className="logo" />
          <h1>Sistema de Colas Virtuales</h1>
          <p>Panel Administrativo</p>
        </div>

        {errorMsg && (
          <div style={{
            background: "#fdecea",
            border: "1px solid #f5c6cb",
            color: "#c0392b",
            borderRadius: "8px",
            padding: "10px 14px",
            fontSize: "0.875rem",
            marginBottom: "20px"
          }}>
            {errorMsg}
          </div>
        )}

        <form className="login-form" onSubmit={handleLogin}>
          <div className="form-group">
            <label>Matrícula</label>
            <input
              type="text"
              placeholder="Ingrese su matrícula"
              value={matricula}
              onChange={(e) => setMatricula(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>Contraseña</label>
            <input
              type="password"
              placeholder="Ingrese su contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button
            type="submit"
            className="btn-login"
            disabled={procesando}
            style={{ opacity: procesando ? 0.7 : 1 }}
          >
            {procesando ? "Verificando..." : "Iniciar Sesión"}
          </button>
        </form>

      </div>
    </div>
  );
}