// src/pages/admin/Administradores.jsx
import "./Administradores.css";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import NavbarAdmin from "./componentes/NavbarAdmin";
import Breadcrumb from "../components/Breadcrumb";
import Footer from "../usuario/componentes/Footer";
import api from "../../services/api";

const formAdminInicial = {
  nombre: "",
  matricula: "",
  password: "",
  confirmarPassword: "",
  principal: false,
};

const formAlumnoInicial = {
  nombre: "",
  email: "",
  carrera: "",
};

export default function Administradores() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const adminLogueado = JSON.parse(localStorage.getItem("user") || "null");

  // ─── Pestañas ─────────────────────────────────────────────────────────────
  const [pestanaActiva, setPestanaActiva] = useState("admins");

  // ─── Estado admins ────────────────────────────────────────────────────────
  const [admins, setAdmins] = useState([]);
  const [cargandoAdmins, setCargandoAdmins] = useState(true);
  const [mostrarFormAdmin, setMostrarFormAdmin] = useState(false);
  const [formAdmin, setFormAdmin] = useState(formAdminInicial);
  const [errorAdmin, setErrorAdmin] = useState("");
  const [procesandoAdmin, setProcesandoAdmin] = useState(false);

  // Modal editar admin
  const [mostrarEditarAdmin, setMostrarEditarAdmin] = useState(false);
  const [adminEditando, setAdminEditando] = useState(null);
  const [formEditarAdmin, setFormEditarAdmin] = useState({ nombre: "", matricula: "", principal: false });
  const [errorEditarAdmin, setErrorEditarAdmin] = useState("");

  // ─── Estado alumnos ───────────────────────────────────────────────────────
  const [alumnos, setAlumnos] = useState([]);
  const [cargandoAlumnos, setCargandoAlumnos] = useState(true);
  const [mostrarFormAlumno, setMostrarFormAlumno] = useState(false);
  const [formAlumno, setFormAlumno] = useState(formAlumnoInicial);
  const [errorAlumno, setErrorAlumno] = useState("");
  const [procesandoAlumno, setProcesandoAlumno] = useState(false);
  const [busquedaAlumno, setBusquedaAlumno] = useState("");

  // Modal editar alumno
  const [mostrarEditarAlumno, setMostrarEditarAlumno] = useState(false);
  const [alumnoEditando, setAlumnoEditando] = useState(null);
  const [formEditarAlumno, setFormEditarAlumno] = useState({ nombre: "", cuatrimestre: 1 });
  const [errorEditarAlumno, setErrorEditarAlumno] = useState("");

  // ─── Guards ───────────────────────────────────────────────────────────────
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user") || "null");
    if (!token || !user || user.rol !== "ADMIN" || !user.principal) {
      navigate("/admin/dashboard");
    }
  }, []);

  // ─── Cargar datos ─────────────────────────────────────────────────────────
  const cargarAdmins = async () => {
    try {
      setCargandoAdmins(true);
      const res = await api.get("/admins", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAdmins(res.data.data || []);
    } catch (error) {
      console.error("Error al cargar administradores:", error);
    } finally {
      setCargandoAdmins(false);
    }
  };

  const cargarAlumnos = async () => {
    try {
      setCargandoAlumnos(true);
      const res = await api.get("/alumnos", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAlumnos(res.data.data || []);
    } catch (error) {
      console.error("Error al cargar alumnos:", error);
    } finally {
      setCargandoAlumnos(false);
    }
  };

  useEffect(() => {
    cargarAdmins();
    cargarAlumnos();
  }, []);

  // ─── Handlers admins ──────────────────────────────────────────────────────
  const handleFormAdminChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormAdmin((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  };

  const handleCrearAdmin = async () => {
    setErrorAdmin("");
    if (!formAdmin.nombre.trim() || formAdmin.nombre.trim().length < 3) {
      setErrorAdmin("El nombre debe tener al menos 3 caracteres."); return;
    }
    if (!formAdmin.matricula.trim()) {
      setErrorAdmin("La matrícula es requerida."); return;
    }
    if (formAdmin.password.length < 6) {
      setErrorAdmin("La contraseña debe tener al menos 6 caracteres."); return;
    }
    if (formAdmin.password !== formAdmin.confirmarPassword) {
      setErrorAdmin("Las contraseñas no coinciden."); return;
    }
    try {
      setProcesandoAdmin(true);
      await api.post("/admins", {
        nombre: formAdmin.nombre,
        matricula: formAdmin.matricula,
        password: formAdmin.password,
        principal: formAdmin.principal,
      }, { headers: { Authorization: `Bearer ${token}` } });
      alert("Administrador creado correctamente.");
      setFormAdmin(formAdminInicial);
      setMostrarFormAdmin(false);
      cargarAdmins();
    } catch (error) {
      setErrorAdmin(error.response?.data?.message || "Error al crear el administrador.");
    } finally {
      setProcesandoAdmin(false);
    }
  };

  const abrirEditarAdmin = (admin) => {
    setAdminEditando(admin);
    setFormEditarAdmin({
      nombre: admin.nombre,
      matricula: admin.matricula,
      principal: admin.principal === 1 || admin.principal === true,
    });
    setErrorEditarAdmin("");
    setMostrarEditarAdmin(true);
  };

  const handleEditarAdmin = async () => {
    setErrorEditarAdmin("");
    if (!formEditarAdmin.nombre.trim()) { setErrorEditarAdmin("El nombre es requerido."); return; }
    if (!formEditarAdmin.matricula.trim()) { setErrorEditarAdmin("La matrícula es requerida."); return; }
    try {
      setProcesandoAdmin(true);
      await api.put(`/admins/${adminEditando.id}`, {
        nombre: formEditarAdmin.nombre,
        matricula: formEditarAdmin.matricula,
        principal: formEditarAdmin.principal,
      }, { headers: { Authorization: `Bearer ${token}` } });
      alert("Administrador actualizado correctamente.");
      setMostrarEditarAdmin(false);
      cargarAdmins();
    } catch (error) {
      setErrorEditarAdmin(error.response?.data?.message || "Error al actualizar.");
    } finally {
      setProcesandoAdmin(false);
    }
  };

  const handleEliminarAdmin = async (admin) => {
    if (admin.id === adminLogueado?.id) { alert("No puedes eliminar tu propia cuenta."); return; }
    if (!window.confirm(`¿Eliminar al administrador "${admin.nombre}"?`)) return;
    try {
      await api.delete(`/admins/${admin.id}`, { headers: { Authorization: `Bearer ${token}` } });
      cargarAdmins();
    } catch (error) {
      alert(error.response?.data?.message || "Error al eliminar.");
    }
  };

  // ─── Handlers alumnos ─────────────────────────────────────────────────────
  const handleFormAlumnoChange = (e) => {
    const { name, value } = e.target;
    setFormAlumno((prev) => ({ ...prev, [name]: value }));
  };

  const handleCrearAlumno = async () => {
    setErrorAlumno("");
    if (!formAlumno.nombre.trim() || formAlumno.nombre.trim().length < 3) {
      setErrorAlumno("El nombre debe tener al menos 3 caracteres."); return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formAlumno.email)) {
      setErrorAlumno("Ingresa un correo válido."); return;
    }
    try {
      setProcesandoAlumno(true);
      const res = await api.post("/alumnos", {
        nombre: formAlumno.nombre,
        email: formAlumno.email,
        carrera: formAlumno.carrera,
      }, { headers: { Authorization: `Bearer ${token}` } });

      const matriculaGenerada = res.data.data?.matricula;
      alert(`✅ Alumno registrado correctamente.\nMatrícula generada: ${matriculaGenerada}\nCredenciales enviadas a ${formAlumno.email}`);
      setFormAlumno(formAlumnoInicial);
      setMostrarFormAlumno(false);
      cargarAlumnos();
    } catch (error) {
      setErrorAlumno(error.response?.data?.message || "Error al registrar el alumno.");
    } finally {
      setProcesandoAlumno(false);
    }
  };

  const abrirEditarAlumno = (alumno) => {
    setAlumnoEditando(alumno);
    setFormEditarAlumno({
      nombre: alumno.nombre,
      cuatrimestre: alumno.cuatrimestre || 1,
      carrera: alumno.carrera || "",
    });
    setErrorEditarAlumno("");
    setMostrarEditarAlumno(true);
  };

  const handleEditarAlumno = async () => {
    setErrorEditarAlumno("");
    if (!formEditarAlumno.nombre.trim()) { setErrorEditarAlumno("El nombre es requerido."); return; }
    try {
      await api.put(`/alumnos/${alumnoEditando.id}`, {
        nombre: formEditarAlumno.nombre,
        matricula: alumnoEditando.matricula, // la matrícula no cambia
        cuatrimestre: Number(formEditarAlumno.cuatrimestre),
        carrera: formEditarAlumno.carrera,
      }, { headers: { Authorization: `Bearer ${token}` } });
      alert("Alumno actualizado correctamente.");
      setMostrarEditarAlumno(false);
      cargarAlumnos();
    } catch (error) {
      setErrorEditarAlumno(error.response?.data?.message || "Error al actualizar.");
    }
  };

  const handleEliminarAlumno = async (alumno) => {
    if (!window.confirm(`¿Eliminar al alumno "${alumno.nombre}"? Esta acción no se puede deshacer.`)) return;
    try {
      await api.delete(`/alumnos/${alumno.id}`, { headers: { Authorization: `Bearer ${token}` } });
      cargarAlumnos();
    } catch (error) {
      alert(error.response?.data?.message || "Error al eliminar.");
    }
  };

  const alumnosFiltrados = alumnos.filter((a) =>
    a.nombre?.toLowerCase().includes(busquedaAlumno.toLowerCase()) ||
    a.matricula?.includes(busquedaAlumno)
  );

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="admin-page">
      <NavbarAdmin />
      <Breadcrumb />

      <div className="admin-container">
        <div className="hero">
          <h1>Gestión de Usuarios</h1>
          <p>Administra los accesos al sistema</p>
        </div>

        {/* Pestañas */}
        <div className="pestanas">
          <button
            className={pestanaActiva === "admins" ? "pestana activa" : "pestana"}
            onClick={() => setPestanaActiva("admins")}
          >
            👤 Administradores ({admins.length})
          </button>
          <button
            className={pestanaActiva === "alumnos" ? "pestana activa" : "pestana"}
            onClick={() => setPestanaActiva("alumnos")}
          >
            🎓 Alumnos ({alumnos.length})
          </button>
        </div>

        {/* ── PESTAÑA ADMINS ────────────────────────────────────────────── */}
        {pestanaActiva === "admins" && (
          <>
            <div className="seccion-header">
              <h2>Administradores registrados</h2>
              <button className="btn-crear" onClick={() => { setFormAdmin(formAdminInicial); setErrorAdmin(""); setMostrarFormAdmin(!mostrarFormAdmin); }}>
                + Nuevo administrador
              </button>
            </div>

            {mostrarFormAdmin && (
              <div className="admin-form-card">
                <h3>Crear administrador</h3>
                <div className="form-group">
                  <label>Nombre completo</label>
                  <input type="text" name="nombre" placeholder="Ej. Juan García" value={formAdmin.nombre} onChange={handleFormAdminChange} />
                </div>
                <div className="form-group">
                  <label>Matrícula</label>
                  <input type="text" name="matricula" placeholder="Ej. ADM001" value={formAdmin.matricula} onChange={handleFormAdminChange} />
                </div>
                <div className="form-group">
                  <label>Contraseña</label>
                  <input type="password" name="password" placeholder="Mínimo 6 caracteres" value={formAdmin.password} onChange={handleFormAdminChange} />
                </div>
                <div className="form-group">
                  <label>Confirmar contraseña</label>
                  <input type="password" name="confirmarPassword" placeholder="Repite la contraseña" value={formAdmin.confirmarPassword} onChange={handleFormAdminChange} />
                </div>
                <div className="form-group" style={{ flexDirection: "row", alignItems: "center", gap: "10px", marginTop: "15px" }}>
                  <input type="checkbox" name="principal" id="principal" checked={formAdmin.principal} onChange={handleFormAdminChange} style={{ width: "18px", height: "18px" }} />
                  <label htmlFor="principal" style={{ marginBottom: 0 }}>Administrador principal</label>
                </div>
                {errorAdmin && <div className="mensaje-error">{errorAdmin}</div>}
                <div style={{ display: "flex", gap: "10px", marginTop: "15px" }}>
                  <button className="btn-guardar" disabled={procesandoAdmin} onClick={handleCrearAdmin}>
                    {procesandoAdmin ? "Creando..." : "Crear administrador"}
                  </button>
                  <button className="btn-cancelar" onClick={() => setMostrarFormAdmin(false)}>Cancelar</button>
                </div>
              </div>
            )}

            {cargandoAdmins ? (
              <p style={{ color: "#888", textAlign: "center" }}>Cargando administradores...</p>
            ) : (
              <div className="admins-grid">
                {admins.map((admin) => (
                  <div key={admin.id} className="admin-card">
                    <span className="badge-admin">{admin.principal ? "⭐ PRINCIPAL" : "ADMINISTRADOR"}</span>
                    <h3>{admin.nombre}</h3>
                    <p style={{ color: "#666", fontSize: "0.9rem" }}>Matrícula: {admin.matricula}</p>
                    {admin.id === adminLogueado?.id && (
                      <p style={{ color: "#205846", fontSize: "0.8rem", fontWeight: "600" }}>← Tú</p>
                    )}
                    <div className="acciones-admin">
                      <button className="btn-eliminar2" onClick={() => abrirEditarAdmin(admin)}>Editar</button>
                      <button className="btn-eliminar" disabled={admin.id === adminLogueado?.id}
                        style={{ opacity: admin.id === adminLogueado?.id ? 0.4 : 1, cursor: admin.id === adminLogueado?.id ? "not-allowed" : "pointer" }}
                        onClick={() => handleEliminarAdmin(admin)}>
                        Eliminar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* ── PESTAÑA ALUMNOS ───────────────────────────────────────────── */}
{pestanaActiva === "alumnos" && (
  <>
    <div className="seccion-header">
      <h2>Alumnos registrados</h2>
      <button className="btn-crear" onClick={() => { setFormAlumno(formAlumnoInicial); setErrorAlumno(""); setMostrarFormAlumno(!mostrarFormAlumno); }}>
        + Registrar alumno
      </button>
    </div>

    {mostrarFormAlumno && (
      <div className="admin-form-card">
        <h3>Registrar nuevo alumno</h3>
        <p style={{ color: "#666", fontSize: "0.85rem", marginBottom: "15px" }}>
          La matrícula se generará automáticamente y se enviará por correo junto con una contraseña temporal.
        </p>
        <div className="form-group">
          <label>Nombre completo</label>
          <input type="text" name="nombre" placeholder="Ej. María García López" value={formAlumno.nombre} onChange={handleFormAlumnoChange} />
        </div>
        <div className="form-group">
          <label>Correo electrónico</label>
          <input type="email" name="email" placeholder="alumno@utslrc.edu.mx" value={formAlumno.email} onChange={handleFormAlumnoChange} />
        </div>
        
        {/* Campo Carrera añadido */}
        <div className="form-group">
          <label>Carrera</label>
          <select name="carrera" value={formAlumno.carrera} onChange={handleFormAlumnoChange}>
            <option value="">Selecciona una carrera</option>
            <optgroup label="TSU">
              <option value="Operaciones Logísticas y Comercio Exterior">Operaciones Logísticas y Comercio Exterior</option>
              <option value="Desarrollo de Negocios">Desarrollo de Negocios</option>
              <option value="Desarrollo de Software Multiplataforma">Desarrollo de Software Multiplataforma</option>
              <option value="Mecatrónica">Mecatrónica</option>
              <option value="Tecnología de Alimentos">Tecnología de Alimentos</option>
              <option value="Mantenimiento Industrial">Mantenimiento Industrial</option>
              <option value="Energía Solar">Energía Solar</option>
            </optgroup>
            <optgroup label="Ingeniería y Licenciatura">
              <option value="Ingeniería en Energía y Desarrollo">Ingeniería en Energía y Desarrollo</option>
              <option value="Ingeniería en Tecnologías de la Información e Innovación Digital">Ingeniería en Tecnologías de la Información e Innovación Digital</option>
              <option value="Ingeniería en Mecatrónica">Ingeniería en Mecatrónica</option>
              <option value="Ingeniería en Alimentos">Ingeniería en Alimentos</option>
              <option value="Ingeniería en Logística Internacional">Ingeniería en Logística Internacional</option>
              <option value="Ingeniería en Mantenimiento Industrial">Ingeniería en Mantenimiento Industrial</option>
              <option value="Licenciatura en Negocios y Mercadotecnia">Licenciatura en Negocios y Mercadotecnia</option>
            </optgroup>
          </select>
        </div>

        {errorAlumno && <div className="mensaje-error">{errorAlumno}</div>}
        <div style={{ display: "flex", gap: "10px", marginTop: "15px" }}>
          <button className="btn-guardar" disabled={procesandoAlumno} onClick={handleCrearAlumno}>
            {procesandoAlumno ? "Registrando..." : "Registrar y enviar credenciales"}
          </button>
          <button className="btn-cancelar" onClick={() => setMostrarFormAlumno(false)}>Cancelar</button>
        </div>
      </div>
    )}

    <input
      className="header-busqueda"
      type="text"
      placeholder="Buscar por nombre o matrícula..."
      value={busquedaAlumno}
      onChange={(e) => setBusquedaAlumno(e.target.value)}
      style={{ marginBottom: "20px" }}
    />

    {cargandoAlumnos ? (
      <p style={{ color: "#888", textAlign: "center" }}>Cargando alumnos...</p>
    ) : alumnosFiltrados.length === 0 ? (
      <p style={{ color: "#888", textAlign: "center" }}>No se encontraron alumnos.</p>
    ) : (
      <div className="admins-grid">
        {alumnosFiltrados.map((alumno) => (
          <div key={alumno.id} className="admin-card">
            <span className="badge-admin" style={{ background: "#E3F2FD", color: "#1565C0" }}>
              🎓 ALUMNO
            </span>
            <h3>{alumno.nombre}</h3>
            <p style={{ color: "#666", fontSize: "0.9rem" }}>Matrícula: {alumno.matricula}</p>
            <p style={{ color: "#666", fontSize: "0.9rem" }}>Cuatrimestre: {alumno.cuatrimestre}</p>
            {/* Carrera añadida a la vista de la tarjeta */}
            <p style={{ color: "#666", fontSize: "0.9rem" }}>Carrera: {alumno.carrera || "No especificada"}</p>
            
            <div className="acciones-admin">
              <button className="btn-eliminar2" onClick={() => abrirEditarAlumno(alumno)}>Editar</button>
              <button className="btn-eliminar" onClick={() => handleEliminarAlumno(alumno)}>Eliminar</button>
            </div>
          </div>
        ))}
      </div>
    )}
  </>
)}
      </div>

      {/* Modal editar admin */}
      {mostrarEditarAdmin && (
        <div className="modal-overlay" onClick={() => setMostrarEditarAdmin(false)}>
          <div className="modal-editar" onClick={(e) => e.stopPropagation()}>
            <h2>Editar administrador</h2>
            <div className="form-group">
              <label>Nombre</label>
              <input type="text" name="nombre" value={formEditarAdmin.nombre} onChange={(e) => setFormEditarAdmin(p => ({ ...p, nombre: e.target.value }))} />
            </div>
            <div className="form-group">
              <label>Matrícula</label>
              <input type="text" name="matricula" value={formEditarAdmin.matricula} onChange={(e) => setFormEditarAdmin(p => ({ ...p, matricula: e.target.value }))} />
            </div>
            <div className="form-group" style={{ flexDirection: "row", alignItems: "center", gap: "10px", marginTop: "15px" }}>
              <input type="checkbox" id="principalEditar" checked={formEditarAdmin.principal} onChange={(e) => setFormEditarAdmin(p => ({ ...p, principal: e.target.checked }))} style={{ width: "18px", height: "18px" }} />
              <label htmlFor="principalEditar" style={{ marginBottom: 0 }}>Administrador principal</label>
            </div>
            {errorEditarAdmin && <div className="mensaje-error">{errorEditarAdmin}</div>}
            <div className="acciones-modal">
              <button className="btn-cancelar" onClick={() => setMostrarEditarAdmin(false)}>Cancelar</button>
              <button className="btn-guardar" disabled={procesandoAdmin} onClick={handleEditarAdmin}>
                {procesandoAdmin ? "Guardando..." : "Guardar cambios"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal editar alumno */}
{mostrarEditarAlumno && (
  <div className="modal-overlay" onClick={() => setMostrarEditarAlumno(false)}>
    <div className="modal-editar" onClick={(e) => e.stopPropagation()}>
      <h2>Editar alumno</h2>
      
      <div className="form-group">
        <label>Nombre</label>
        <input 
          type="text" 
          value={formEditarAlumno.nombre} 
          onChange={(e) => setFormEditarAlumno(p => ({ ...p, nombre: e.target.value }))} 
        />
      </div>

      <div className="form-group">
        <label>Matrícula</label>
        <input 
          type="text" 
          value={alumnoEditando?.matricula} 
          disabled 
          style={{ background: "#f5f5f5", color: "#999" }} 
        />
        <small style={{ color: "#888" }}>La matrícula no puede modificarse</small>
      </div>

      <div className="form-group">
        <label>Carrera</label>
        <select 
          value={formEditarAlumno.carrera} 
          onChange={(e) => setFormEditarAlumno(p => ({ ...p, carrera: e.target.value }))}
        >
          <option value="">Selecciona una carrera</option>
          <optgroup label="TSU">
            <option value="Operaciones Logísticas y Comercio Exterior">Operaciones Logísticas y Comercio Exterior</option>
            <option value="Desarrollo de Negocios">Desarrollo de Negocios</option>
            <option value="Desarrollo de Software Multiplataforma">Desarrollo de Software Multiplataforma</option>
            <option value="Mecatrónica">Mecatrónica</option>
            <option value="Tecnología de Alimentos">Tecnología de Alimentos</option>
            <option value="Mantenimiento Industrial">Mantenimiento Industrial</option>
            <option value="Energía Solar">Energía Solar</option>
          </optgroup>
          <optgroup label="Ingeniería y Licenciatura">
            <option value="Ingeniería en Energía y Desarrollo">Ingeniería en Energía y Desarrollo</option>
            <option value="Ingeniería en Tecnologías de la Información e Innovación Digital">Ingeniería en Tecnologías de la Información e Innovación Digital</option>
            <option value="Ingeniería en Mecatrónica">Ingeniería en Mecatrónica</option>
            <option value="Ingeniería en Alimentos">Ingeniería en Alimentos</option>
            <option value="Ingeniería en Logística Internacional">Ingeniería en Logística Internacional</option>
            <option value="Ingeniería en Mantenimiento Industrial">Ingeniería en Mantenimiento Industrial</option>
            <option value="Licenciatura en Negocios y Mercadotecnia">Licenciatura en Negocios y Mercadotecnia</option>
          </optgroup>
        </select>
      </div>

      <div className="form-group">
        <label>Cuatrimestre</label>
        <select 
          value={formEditarAlumno.cuatrimestre} 
          onChange={(e) => setFormEditarAlumno(p => ({ ...p, cuatrimestre: e.target.value }))}
        >
          {[...Array(10)].map((_, i) => (
            <option key={i + 1} value={i + 1}>{i + 1}</option>
          ))}
        </select>
      </div>

      {errorEditarAlumno && <div className="mensaje-error">{errorEditarAlumno}</div>}
      
      <div className="acciones-modal">
        <button className="btn-cancelar" onClick={() => setMostrarEditarAlumno(false)}>Cancelar</button>
        <button className="btn-guardar" onClick={handleEditarAlumno}>Guardar cambios</button>
      </div>
    </div>
  </div>
    )}
      <Footer />
    </div>
  );
}