// src/pages/admin/Administradores.jsx
import "./Administradores.css";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import NavbarAdmin from "./componentes/NavbarAdmin";
import Breadcrumb from "../components/Breadcrumb";
import Footer from "../usuario/componentes/Footer";
import api from "../../services/api";

const formInicial = {
  nombre: "",
  matricula: "",
  password: "",
  confirmarPassword: "",
  principal: false,
};

export default function Administradores() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const adminLogueado = JSON.parse(localStorage.getItem("user") || "null");

  const [admins, setAdmins] = useState([]);
  const [cargando, setCargando] = useState(true);

  // Modal crear
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [form, setForm] = useState(formInicial);
  const [error, setError] = useState("");
  const [procesando, setProcesando] = useState(false);

  // Modal editar
  const [mostrarEditar, setMostrarEditar] = useState(false);
  const [adminEditando, setAdminEditando] = useState(null);
  const [formEditar, setFormEditar] = useState({
    nombre: "",
    matricula: "",
    principal: false,
  });
  const [errorEditar, setErrorEditar] = useState("");

  // ─── Cargar admins ────────────────────────────────────────────────────────
  const cargarAdmins = async () => {
    try {
      setCargando(true);
      const res = await api.get("/admins", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAdmins(res.data.data || []);
    } catch (error) {
      console.error("Error al cargar administradores:", error);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    if (!token || !adminLogueado?.principal) {
      navigate("/admin/dashboard");
      return;
    }
    cargarAdmins();
  }, []);

  // ─── Helpers ──────────────────────────────────────────────────────────────
  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleFormEditarChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormEditar((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // ─── Crear admin ──────────────────────────────────────────────────────────
  const handleCrear = async () => {
    setError("");

    if (!form.nombre.trim() || form.nombre.trim().length < 3) {
      setError("El nombre debe tener al menos 3 caracteres.");
      return;
    }
    if (!form.matricula.trim()) {
      setError("La matrícula es requerida.");
      return;
    }
    if (form.password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }
    if (form.password !== form.confirmarPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    try {
      setProcesando(true);
      await api.post(
        "/admins",
        {
          nombre: form.nombre,
          matricula: form.matricula,
          password: form.password,
          principal: form.principal,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert("Administrador creado correctamente.");
      setForm(formInicial);
      setMostrarFormulario(false);
      cargarAdmins();
    } catch (error) {
      setError(error.response?.data?.message || "Error al crear el administrador.");
    } finally {
      setProcesando(false);
    }
  };

  // ─── Abrir editar ─────────────────────────────────────────────────────────
  const abrirEditar = (admin) => {
    setAdminEditando(admin);
    setFormEditar({
      nombre: admin.nombre,
      matricula: admin.matricula,
      principal: admin.principal === 1 || admin.principal === true,
    });
    setErrorEditar("");
    setMostrarEditar(true);
  };

  // ─── Guardar edición ──────────────────────────────────────────────────────
  const handleEditar = async () => {
    setErrorEditar("");

    if (!formEditar.nombre.trim()) {
      setErrorEditar("El nombre es requerido.");
      return;
    }
    if (!formEditar.matricula.trim()) {
      setErrorEditar("La matrícula es requerida.");
      return;
    }

    try {
      setProcesando(true);
      await api.put(
        `/admins/${adminEditando.id}`,
        {
          nombre: formEditar.nombre,
          matricula: formEditar.matricula,
          principal: formEditar.principal,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert("Administrador actualizado correctamente.");
      setMostrarEditar(false);
      cargarAdmins();
    } catch (error) {
      setErrorEditar(
        error.response?.data?.message || "Error al actualizar el administrador."
      );
    } finally {
      setProcesando(false);
    }
  };

  // ─── Eliminar admin ───────────────────────────────────────────────────────
  const handleEliminar = async (admin) => {
    // No permitir eliminar al propio admin logueado
    if (admin.id === adminLogueado?.id) {
      alert("No puedes eliminar tu propia cuenta.");
      return;
    }

    const confirmar = window.confirm(
      `¿Eliminar al administrador "${admin.nombre}"? Esta acción no se puede deshacer.`
    );
    if (!confirmar) return;

    try {
      await api.delete(`/admins/${admin.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      cargarAdmins();
    } catch (error) {
      alert(error.response?.data?.message || "Error al eliminar el administrador.");
    }
  };

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="admin-page">
      <NavbarAdmin />
      <Breadcrumb />
      <div className="admin-container">

        <div className="hero">
          <h1>Administradores</h1>
          <p>Gestiona los usuarios con acceso administrativo al sistema</p>
        </div>

        <div className="seccion-header">
          <h2>Administradores registrados ({admins.length})</h2>
          <button
            className="btn-crear"
            onClick={() => {
              setForm(formInicial);
              setError("");
              setMostrarFormulario(!mostrarFormulario);
            }}
          >
            + Nuevo administrador
          </button>
        </div>

        {/* Formulario crear */}
        {mostrarFormulario && (
          <div className="admin-form-card">
            <h3>Crear administrador</h3>

            <div className="form-group">
              <label>Nombre completo</label>
              <input
                type="text"
                name="nombre"
                placeholder="Ej. Juan García"
                value={form.nombre}
                onChange={handleFormChange}
              />
            </div>

            <div className="form-group">
              <label>Matrícula</label>
              <input
                type="text"
                name="matricula"
                placeholder="Ej. ADM001"
                value={form.matricula}
                onChange={handleFormChange}
              />
            </div>

            <div className="form-group">
              <label>Contraseña</label>
              <input
                type="password"
                name="password"
                placeholder="Mínimo 6 caracteres"
                value={form.password}
                onChange={handleFormChange}
              />
            </div>

            <div className="form-group">
              <label>Confirmar contraseña</label>
              <input
                type="password"
                name="confirmarPassword"
                placeholder="Repite la contraseña"
                value={form.confirmarPassword}
                onChange={handleFormChange}
              />
            </div>

            <div className="form-group" style={{ flexDirection: "row", alignItems: "center", gap: "10px", marginTop: "15px" }}>
              <input
                type="checkbox"
                name="principal"
                id="principal"
                checked={form.principal}
                onChange={handleFormChange}
                style={{ width: "18px", height: "18px" }}
              />
              <label htmlFor="principal" style={{ marginBottom: 0 }}>
                Administrador principal (puede gestionar otros admins)
              </label>
            </div>

            {error && <div className="mensaje-error">{error}</div>}

            <div style={{ display: "flex", gap: "10px", marginTop: "15px" }}>
              <button
                className="btn-guardar"
                disabled={procesando}
                onClick={handleCrear}
              >
                {procesando ? "Creando..." : "Crear administrador"}
              </button>
              <button
                className="btn-cancelar"
                onClick={() => setMostrarFormulario(false)}
              >
                Cancelar
              </button>
            </div>
          </div>
        )}

        {/* Grid de admins */}
        {cargando ? (
          <p style={{ color: "#888", textAlign: "center" }}>Cargando administradores...</p>
        ) : admins.length === 0 ? (
          <p style={{ color: "#888", textAlign: "center" }}>No hay administradores registrados.</p>
        ) : (
          <div className="admins-grid">
            {admins.map((admin) => (
              <div key={admin.id} className="admin-card">
                <span className="badge-admin">
                  {admin.principal ? "⭐ PRINCIPAL" : "ADMINISTRADOR"}
                </span>

                <h3>{admin.nombre}</h3>
                <p style={{ color: "#666", fontSize: "0.9rem" }}>
                  Matrícula: {admin.matricula}
                </p>

                {/* Indicador si es el admin logueado */}
                {admin.id === adminLogueado?.id && (
                  <p style={{ color: "#205846", fontSize: "0.8rem", fontWeight: "600" }}>
                    ← Tú
                  </p>
                )}

                <div className="acciones-admin">
                  <button
                    className="btn-eliminar2"
                    onClick={() => abrirEditar(admin)}
                  >
                    Editar
                  </button>
                  <button
                    className="btn-eliminar"
                    disabled={admin.id === adminLogueado?.id}
                    style={{
                      opacity: admin.id === adminLogueado?.id ? 0.4 : 1,
                      cursor: admin.id === adminLogueado?.id ? "not-allowed" : "pointer",
                    }}
                    onClick={() => handleEliminar(admin)}
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal editar */}
      {mostrarEditar && (
        <div className="modal-overlay" onClick={() => setMostrarEditar(false)}>
          <div className="modal-editar" onClick={(e) => e.stopPropagation()}>
            <h2>Editar administrador</h2>

            <div className="form-group">
              <label>Nombre</label>
              <input
                type="text"
                name="nombre"
                value={formEditar.nombre}
                onChange={handleFormEditarChange}
              />
            </div>

            <div className="form-group">
              <label>Matrícula</label>
              <input
                type="text"
                name="matricula"
                value={formEditar.matricula}
                onChange={handleFormEditarChange}
              />
            </div>

            <div className="form-group" style={{ flexDirection: "row", alignItems: "center", gap: "10px", marginTop: "15px" }}>
              <input
                type="checkbox"
                name="principal"
                id="principalEditar"
                checked={formEditar.principal}
                onChange={handleFormEditarChange}
                style={{ width: "18px", height: "18px" }}
              />
              <label htmlFor="principalEditar" style={{ marginBottom: 0 }}>
                Administrador principal
              </label>
            </div>

            {errorEditar && <div className="mensaje-error">{errorEditar}</div>}

            <div className="acciones-modal">
              <button
                className="btn-cancelar"
                onClick={() => setMostrarEditar(false)}
              >
                Cancelar
              </button>
              <button
                className="btn-guardar"
                disabled={procesando}
                onClick={handleEditar}
              >
                {procesando ? "Guardando..." : "Guardar cambios"}
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}