import { createContext, useContext, useMemo } from 'react';
import { useAuth } from './AuthContext.jsx';

const UserContext = createContext({
  user: { uid: '', nombre: '', rol: 'empleado', sucursalId: 'principal' },
  isSuperUser: false,
  isAdmin: false,
});

function normalizeRole(role) {
  return String(role || 'empleado')
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, '');
}

export const UserProvider = ({ children }) => {
  const { user: authUser, perfil } = useAuth();

  const value = useMemo(() => {
    const rol = normalizeRole(perfil?.rol || perfil?.role || perfil?.tipoUsuario);
    const user = {
      uid: authUser?.uid || '',
      email: authUser?.email || '',
      nombre: perfil?.nombre || authUser?.email || '',
      rol,
      sucursalId: perfil?.sucursalId || perfil?.sucursal || 'principal',
    };

    return {
      user,
      isSuperUser: rol === 'superadmin',
      isAdmin: rol === 'superadmin' || rol === 'admin',
    };
  }, [authUser, perfil]);

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};

export const useUser = () => useContext(UserContext);
