import { useState } from 'react';
import {
  AppBar,
  Box,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
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
import MenuIcon from '@mui/icons-material/Menu';
import LogoutIcon from '@mui/icons-material/Logout';
import { Link, useLocation } from 'react-router-dom';
import { useUser } from '../../contexts/UserContext.jsx';

const drawerWidth = 260;

const menu = [
  ['Dashboard', '/dashboard', <DashboardIcon />],
  ['Ventas', '/ventas', <PointOfSaleIcon />],
  ['Gastos Diarios', '/gastos', <ReceiptLongIcon />],
  ['Apartados', '/apartados', <SavingsIcon />],
  ['Clientes', '/clientes', <PersonIcon />],
  ['Cargas', '/cargas', <LocalShippingIcon />],
  ['Nóminas', '/nominas', <GroupsIcon />],
  ['Cortes', '/cortes', <PaymentsIcon />, 'admin'],
  ['Inventario Pasivo', '/inventario', <InventoryIcon />],
  ['Reportes', '/reportes', <AssessmentIcon />],
  ['Configuración', '/configuracion', <SettingsIcon />],
];

export default function MainLayout({ children }) {
  const { pathname } = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { isAdmin } = useUser();
  const [mobileOpen, setMobileOpen] = useState(false);
  const visibleMenu = menu.filter(([, , , role]) => !role || isAdmin);

  const drawerContent = (
    <>
      <Toolbar />
      <List sx={{ p: 1 }}>
        {visibleMenu.map(([text, path, icon]) => (
          <ListItemButton
            key={path}
            component={Link}
            to={path}
            selected={pathname === path}
            onClick={() => isMobile && setMobileOpen(false)}
            sx={{ borderRadius: 2, mb: 0.5 }}
          >
            <ListItemIcon>{icon}</ListItemIcon>
            <ListItemText primary={text} />
          </ListItemButton>
        ))}

        <ListItemButton
          onClick={() => {
            window.location.href = '/login';
          }}
          sx={{ borderRadius: 2, mt: 2 }}
        >
          <ListItemIcon>
            <LogoutIcon />
          </ListItemIcon>
          <ListItemText primary="Cerrar sesión" />
        </ListItemButton>
      </List>
    </>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppBar
        position="fixed"
        sx={{
          zIndex: 1201,
          width: { md: `calc(100% - ${drawerWidth}px)` },
          ml: { md: `${drawerWidth}px` },
        }}
      >
        <Toolbar>
          {isMobile && (
            <IconButton
              color="inherit"
              edge="start"
              onClick={() => setMobileOpen(true)}
              sx={{ mr: 1 }}
            >
              <MenuIcon />
            </IconButton>
          )}

          <Typography variant="h6" noWrap>
            Bazar El Chunky ERP
          </Typography>
        </Toolbar>
      </AppBar>

      <Drawer
        variant={isMobile ? 'temporary' : 'permanent'}
        open={isMobile ? mobileOpen : true}
        onClose={() => setMobileOpen(false)}
        ModalProps={{ keepMounted: true }}
        sx={{
          width: isMobile ? 'auto' : drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
          },
        }}
      >
        {drawerContent}
      </Drawer>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          minWidth: 0,
          width: '100%',
          p: { xs: 1.5, sm: 2, md: 3 },
        }}
      >
        <Toolbar />
        {children}
      </Box>
    </Box>
  );
}

