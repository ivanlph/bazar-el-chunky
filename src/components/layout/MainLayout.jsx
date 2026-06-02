import { AppBar, Box, Drawer, List, ListItemButton, ListItemIcon, ListItemText, Toolbar, Typography } from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PointOfSaleIcon from '@mui/icons-material/PointOfSale';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import GroupsIcon from '@mui/icons-material/Groups';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import PaymentsIcon from '@mui/icons-material/Payments';
import InventoryIcon from '@mui/icons-material/Inventory';
import AssessmentIcon from '@mui/icons-material/Assessment';
import SettingsIcon from '@mui/icons-material/Settings';
import SavingsIcon from '@mui/icons-material/Savings';
import PersonIcon from '@mui/icons-material/Person';
import { Link, useLocation } from 'react-router-dom';
import LogoutIcon from '@mui/icons-material/Logout';
import { useAuth } from '../../contexts/AuthContext.jsx';
//const { perfil, logout } = useAuth();
const drawerWidth = 260;
<ListItemButton onClick={() => window.location.href = '/login'}>
  <ListItemIcon>
    <LogoutIcon />
  </ListItemIcon>
  <ListItemText primary="Cerrar sesión" />
</ListItemButton>
const menu = [

  ['Dashboard', '/dashboard', <DashboardIcon />],
  ['Ventas', '/ventas', <PointOfSaleIcon />],
  ['Gastos Diarios', '/gastos', <ReceiptLongIcon />],
  ['Apartados', '/apartados', <SavingsIcon />],
  ['Clientes', '/clientes', <PersonIcon />],
  ['Cargas', '/cargas', <LocalShippingIcon />],
  ['Nóminas', '/nominas', <GroupsIcon />],
  ['Cortes', '/cortes', <PaymentsIcon />],
  ['Inventario Pasivo', '/inventario', <InventoryIcon />],
  ['Reportes', '/reportes', <AssessmentIcon />],
  ['Configuración', '/configuracion', <SettingsIcon />],
 
  
];

export default function MainLayout({ children }) {
  const { pathname } = useLocation();
  //const { logout, perfil } = useAuth();
  return <Box sx={{ display: 'flex' }}>
    <AppBar position="fixed" sx={{ zIndex: 1201 }}><Toolbar><Typography variant="h6">Bazar El Chunky ERP</Typography></Toolbar></AppBar>
    <Drawer variant="permanent" sx={{ width: drawerWidth, '& .MuiDrawer-paper': { width: drawerWidth, boxSizing: 'border-box' } }}>
      <Toolbar />
      <List sx={{ p: 1 }}>{menu.map(([text, path, icon]) => <ListItemButton key={path} component={Link} to={path} selected={pathname === path} sx={{ borderRadius: 3, mb: .5 }}><ListItemIcon>{icon}</ListItemIcon><ListItemText primary={text} /></ListItemButton>)}</List>
    </Drawer>
    <Box component="main" sx={{ flexGrow: 1, p: 3 }}><Toolbar />{children}</Box>
  </Box>;
}
