import CheckroomIcon from '@mui/icons-material/Checkroom';
import ChairIcon from '@mui/icons-material/Chair';
import HeadphonesIcon from '@mui/icons-material/Headphones';
import ConstructionIcon from '@mui/icons-material/Construction';
import HomeIcon from '@mui/icons-material/Home';
import KitchenIcon from '@mui/icons-material/Kitchen';
import ToysIcon from '@mui/icons-material/Toys';
import LocalMallIcon from '@mui/icons-material/LocalMall';
import SportsBasketballIcon from '@mui/icons-material/SportsBasketball';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import MovieIcon from '@mui/icons-material/Movie';
import CategoryIcon from '@mui/icons-material/Category';

export const categoriasVenta = [
  { id: 'Ropa', label: 'Ropa', Icon: CheckroomIcon },
  { id: 'Muebles', label: 'Muebles', Icon: ChairIcon },
  { id: 'Electrónica', label: 'Electrónica', Icon: HeadphonesIcon },
  { id: 'Herramientas', label: 'Herramientas', Icon: ConstructionIcon },
  { id: 'Hogar', label: 'Hogar', Icon: HomeIcon },
  { id: 'Cocina', label: 'Cocina', Icon: KitchenIcon },
  { id: 'Juguetes', label: 'Juguetes', Icon: ToysIcon },
  { id: 'Accesorios', label: 'Accesorios', Icon: LocalMallIcon },
  { id: 'Deportes', label: 'Deportes', Icon: SportsBasketballIcon },
  { id: 'Automotriz', label: 'Automotriz', Icon: DirectionsCarIcon },
  { id: 'Entretenimiento', label: 'Entretenimiento', Icon: MovieIcon },
  { id: 'Chácharas', label: 'Chácharas', Icon: CategoryIcon },
];

const aliases = {
  Chacharas: 'Chácharas',
  Electronicos: 'Electrónica',
  Electronica: 'Electrónica',
  Herramienta: 'Herramientas',
  Otros: 'Chácharas',
};

export function normalizeCategoria(categoria) {
  const value = String(categoria || '').trim();
  return aliases[value] || value;
}

export function getCategoriasFromVenta(venta) {
  if (Array.isArray(venta.categorias) && venta.categorias.length) {
    return venta.categorias.map(normalizeCategoria).filter(Boolean);
  }

  return String(venta.categoria || '')
    .split(',')
    .map(normalizeCategoria)
    .filter(Boolean);
}

export function getCategoriaMeta(categoria) {
  const normalized = normalizeCategoria(categoria);
  return (
    categoriasVenta.find((item) => item.id === normalized) ||
    categoriasVenta.find((item) => item.id === 'Chácharas')
  );
}
