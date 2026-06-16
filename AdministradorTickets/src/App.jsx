import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

// ADMIN
import LoginAdmin from "./pages/admin/LoginAdmin";
import DashboardAdmin from "./pages/admin/DashboardAdmin";
import EventosAdmin from "./pages/admin/EventosAdmin";
import ColaAdmin from "./pages/admin/ColaAdmin";
import Administradores from "./pages/admin/Administradores";

// USUARIO
import NotFound from "./pages/usuario/NotFound";
import HomePage from "./pages/usuario/HomePage";
import LoginUsuario from "./pages/usuario/LoginUsuario";
import RegistroUsuario from "./pages/usuario/RegistroUsuario";
import Eventos from "./pages/usuario/Eventos";
import DetalleEvento from "./pages/usuario/DetalleEvento";
import MisEventos from "./pages/usuario/MisEventos";
import ResetPassword from "./pages/usuario/ResetPassword";
import Contacto from "./pages/usuario/Contacto";
import Preguntas from "./pages/usuario/Preguntas";
import Perfil from "./pages/usuario/Perfil";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Ruta inicial */}
        <Route
          path="/"
          element={<Navigate to="/Homepage" />}
        />

        {/* ADMIN */}
        <Route
          path="/admin/login"
          element={<LoginAdmin />}
        />

        <Route
          path="/admin/dashboard"
          element={<DashboardAdmin />}
        />

        <Route
          path="/admin/eventos"
          element={<EventosAdmin />}
        />


        <Route
          path="/admin/cola"
          element={<ColaAdmin />}
        />

        <Route
          path="/admin/administradores"
          element={<Administradores />}
        />

        {/* USUARIOS */}
        <Route
          path="/Homepage"
          element={<HomePage />}
        />

        <Route
          path="/login"
          element={<LoginUsuario />}
        />

        <Route
          path="/eventos"
          element={<Eventos />}
        />

        <Route
          path="/evento/:id"
          element={<DetalleEvento />}
        />

        <Route
          path="/mis-eventos"
          element={<MisEventos />}
        />

        <Route
          path="/contacto"
          element={<Contacto />}
        />

        <Route
          path="/preguntas"
          element={<Preguntas />}
        />

        <Route
          path="/perfil"
          element={<Perfil />}
        />

        <Route
          path="/reset-password"
          element={<ResetPassword />}
        />

        <Route path="*" element={<NotFound />} />

        
      </Routes>
    </BrowserRouter>
  );
}

export default App;