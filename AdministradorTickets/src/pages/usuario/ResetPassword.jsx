// src/pages/usuario/ResetPassword.jsx
import "./ResetPassword.css";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "./componentes/Navbar";
import Breadcrumb from "../components/Breadcrumb";
import Footer from "./componentes/Footer";
import api from "../../services/api";

// Componente reutilizable de input con contador
function InputConContador({ value, onChange, maxLength = 8, ...props }) {
  return (
    <div style={{ position: "relative" }}>
      <input
        value={value}
        onChange={onChange}
        maxLength={maxLength}
        {...props}
      />
      <span style={{
        position: "absolute",
        right: "10px",
        top: "50%",
        transform: "translateY(-50%)",
        fontSize: "0.75rem",
        color: value.length >= maxLength ? "#c0392b" : "#aaa",
        pointerEvents: "none",
        fontWeight: value.length >= maxLength ? "700" : "400",
      }}>
        {value.length}/{maxLength}
      </span>
    </div>
  );
}

export default function ResetPassword() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [matricula, setMatricula] = useState("");
  const [codigo, setCodigo] = useState("");
  const [password, setPassword] = useState("");
  const [confirmarPassword, setConfirmarPassword] = useState("");
  const [procesando, setProcesando] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [infoMsg, setInfoMsg] = useState("");

  // PASO 1 — Enviar código al correo
  const handleEnviarCodigo = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setInfoMsg("");

    if (!matricula.trim()) {
      setErrorMsg("Ingresa tu matrícula.");
      return;
    }

    if (matricula.length !== 8) {
      setErrorMsg("La matrícula debe tener exactamente 8 caracteres.");
      return;
    }

    try {
      setProcesando(true);
      await api.post("/reset/enviar-codigo", { matricula });
      setInfoMsg("Código enviado a tu correo registrado. Revisa tu bandeja.");
      setStep(2);
    } catch (error) {
      setErrorMsg(error.response?.data?.message || "Error al enviar el código.");
    } finally {
      setProcesando(false);
    }
  };

  // PASO 2 — Validar código
  const handleValidarCodigo = async (e) => {
    e.preventDefault();
    setErrorMsg("");

    if (!codigo.trim()) {
      setErrorMsg("Ingresa el código de verificación.");
      return;
    }

    if (codigo.length !== 6) {
      setErrorMsg("El código debe tener exactamente 6 dígitos.");
      return;
    }

    try {
      setProcesando(true);
      await api.post("/reset/validar-codigo", { matricula, codigo });
      setStep(3);
    } catch (error) {
      setErrorMsg(error.response?.data?.message || "Código incorrecto o expirado.");
    } finally {
      setProcesando(false);
    }
  };

  // PASO 3 — Cambiar contraseña
  const handleCambiarPassword = async (e) => {
    e.preventDefault();
    setErrorMsg("");

    if (!password || !confirmarPassword) {
      setErrorMsg("Completa ambos campos.");
      return;
    }

    if (password !== confirmarPassword) {
      setErrorMsg("Las contraseñas no coinciden.");
      return;
    }

    if (password.length < 6) {
      setErrorMsg("La contraseña debe tener al menos 6 caracteres.");
      return;
    }

    try {
      setProcesando(true);
      await api.post("/reset/cambiar-password", {
        matricula,
        nuevaPassword: password,
      });
      setStep(4);
    } catch (error) {
      setErrorMsg(error.response?.data?.message || "Error al cambiar la contraseña.");
    } finally {
      setProcesando(false);
    }
  };

  return (
    <div className="reset-page">
      <Navbar />
      <Breadcrumb />
      <div className="reset-body">
        <div className="reset-card">

          {/* Indicador de pasos */}
          {step < 4 && (
            <div className="reset-steps">
              {[1, 2, 3].map((n) => (
                <div key={n} className={`reset-step ${step >= n ? "activo" : ""}`}>
                  <span>{n}</span>
                </div>
              ))}
            </div>
          )}

          {/* Mensajes */}
          {errorMsg && <p className="error-alert">{errorMsg}</p>}
          {infoMsg && <p className="info-alert">{infoMsg}</p>}

          {/* PASO 1 */}
          {step === 1 && (
            <form onSubmit={handleEnviarCodigo}>
              <h2>Restablecer contraseña</h2>
              <p>Ingresa tu matrícula y te enviaremos un código a tu correo registrado.</p>
              <div className="form-group">
                <label>Matrícula <span style={{ color: "#aaa", fontSize: "0.8rem" }}>(máx. 8 caracteres)</span></label>
                <InputConContador
                  type="text"
                  placeholder="Ej. 20260001"
                  value={matricula}
                  maxLength={8}
                  onChange={(e) => setMatricula(e.target.value)}
                  onKeyPress={(e) => {
                    if (!/[0-9]/.test(e.key)) e.preventDefault();
                  }}
                  style={{ paddingRight: "55px" }}
                />
              </div>
              <button type="submit" className="btn-primary" disabled={procesando}>
                {procesando ? "Enviando..." : "Enviar código"}
              </button>
            </form>
          )}

          {/* PASO 2 */}
          {step === 2 && (
            <form onSubmit={handleValidarCodigo}>
              <h2>Verificar código</h2>
              <p>Ingresa el código de 6 dígitos que enviamos a tu correo.</p>
              <div className="form-group">
                <label>Código de verificación <span style={{ color: "#aaa", fontSize: "0.8rem" }}>(6 dígitos)</span></label>
                <InputConContador
                  type="text"
                  placeholder="000000"
                  value={codigo}
                  maxLength={6}
                  onChange={(e) => setCodigo(e.target.value)}
                  onKeyPress={(e) => {
                    if (!/[0-9]/.test(e.key)) e.preventDefault();
                  }}
                  style={{
                    letterSpacing: "6px",
                    fontSize: "1.3rem",
                    textAlign: "center",
                    paddingRight: "55px"
                  }}
                />
              </div>
              <button type="submit" className="btn-primary" disabled={procesando}>
                {procesando ? "Validando..." : "Verificar"}
              </button>
              <button
                type="button"
                className="btn-outline"
                disabled={procesando}
                onClick={() => { setStep(1); setErrorMsg(""); setInfoMsg(""); }}
              >
                Volver
              </button>
            </form>
          )}

          {/* PASO 3 */}
          {step === 3 && (
            <form onSubmit={handleCambiarPassword}>
              <h2>Nueva contraseña</h2>
              <p>Elige una contraseña segura para tu cuenta.</p>
              <div className="form-group">
                <label>Nueva contraseña <span style={{ color: "#aaa", fontSize: "0.8rem" }}>(máx. 8 caracteres)</span></label>
                <InputConContador
                  type="password"
                  placeholder="Mínimo 6 caracteres"
                  value={password}
                  maxLength={8}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{ paddingRight: "55px" }}
                />
              </div>
              <div className="form-group">
                <label>Confirmar contraseña <span style={{ color: "#aaa", fontSize: "0.8rem" }}>(máx. 8 caracteres)</span></label>
                <InputConContador
                  type="password"
                  placeholder="Repite la contraseña"
                  value={confirmarPassword}
                  maxLength={8}
                  onChange={(e) => setConfirmarPassword(e.target.value)}
                  style={{ paddingRight: "55px" }}
                />
              </div>
              <button type="submit" className="btn-primary" disabled={procesando}>
                {procesando ? "Guardando..." : "Guardar contraseña"}
              </button>
            </form>
          )}

          {/* PASO 4 — Éxito */}
          {step === 4 && (
            <div className="reset-exito">
              <div className="exito-icono">✓</div>
              <h2>¡Contraseña actualizada!</h2>
              <p>Tu contraseña ha sido cambiada correctamente. Ya puedes iniciar sesión.</p>
              <button
                className="btn-primary"
                onClick={() => navigate("/login")}
              >
                Ir al inicio de sesión
              </button>
            </div>
          )}

        </div>
      </div>
      <Footer />
    </div>
  );
}