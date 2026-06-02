import { Routes, Route, Navigate } from 'react-router-dom';
import { UserProvider } from './contexts/UserContext.jsx';
import MainLayout from './components/layout/MainLayout.jsx';
import Dashboard from './pages/Dashboard/Dashboard.jsx';
import Ventas from './pages/Ventas/Ventas.jsx';
import Gastos from './pages/Gastos/Gastos.jsx';
import Apartados from './pages/Apartados/Apartados.jsx';
import Clientes from './pages/Clientes/Clientes.jsx';
import Cargas from './pages/Cargas/Cargas.jsx';
import Nominas from './pages/Nominas/Nominas.jsx';
import Cortes from './pages/Cortes/Cortes.jsx';
import Inventario from './pages/Inventario/Inventario.jsx';
import Reportes from './pages/Reportes/Reportes.jsx';
import Configuracion from './pages/Configuracion/Configuracion.jsx';
import Login from './pages/Login/Login.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import CargaDetalle from './pages/Cargas/CargaDetalle.jsx';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
  
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <UserProvider>
              <MainLayout>
                <Routes>
                  <Route path="/" element={<Navigate to="/dashboard" replace />} />
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/ventas" element={<Ventas />} />
                  <Route path="/gastos" element={<Gastos />} />
                  <Route path="/apartados" element={<Apartados />} />
                  <Route path="/clientes" element={<Clientes />} />
                  <Route path="/cargas" element={<Cargas />} />
                  <Route path="/cargas/:id" element={<CargaDetalle />} />
                  <Route path="/nominas" element={<Nominas />} />
                  <Route path="/cortes" element={<Cortes />} />
                  <Route path="/inventario" element={<Inventario />} />
                  <Route path="/reportes" element={<Reportes />} />
                  <Route path="/configuracion" element={<Configuracion />} />

                </Routes>
              </MainLayout>
            </UserProvider>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}
