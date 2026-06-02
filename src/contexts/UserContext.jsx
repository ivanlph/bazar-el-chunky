import { createContext, useContext } from 'react';

const UserContext = createContext({
  user: { uid: 'demo-user', nombre: 'Chunky Boy', rol: 'superadmin', sucursalId: 'principal' },
  isSuperUser: true,
});

export const UserProvider = ({ children }) => <UserContext.Provider value={{ user: { uid: 'demo-user', nombre: 'Chunky Boy', rol: 'superadmin', sucursalId: 'principal' }, isSuperUser: true }}>{children}</UserContext.Provider>;
export const useUser = () => useContext(UserContext);
