import { useEffect, useState } from 'react';
import {
  Box,
  Card,
  Grid,
  Typography,
  List,
  ListItem,
  ListItemText,
  LinearProgress,
} from '@mui/material';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../../services/firebase/firebase.js';
import { formatMoney } from '../../utils/money.js';
import { todayKey } from '../../utils/date.js';

export default function Dashboard() {
  const [ventas, setVentas] = useState([]);
  const [gastos, setGastos] = useState([]);
  const [apartados, setApartados] = useState([]);



  const hoy = todayKey();

  useEffect(() => {
    const unsubVentas = onSnapshot(collection(db, 'ventas'), (snap) => {
      setVentas(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });

    const unsubGastos = onSnapshot(collection(db, 'gastosDiarios'), (snap) => {
      setGastos(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });

    const unsubApartados = onSnapshot(collection(db, 'apartados'), (snap) => {
      setApartados(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });

    return () => {
      unsubVentas();
      unsubGastos();
      unsubApartados();
    };
  }, []);

  const ventasHoy = ventas.filter((v) => v.fecha === hoy);
  const gastosHoy = gastos.filter((g) => g.fecha === hoy);

  const totalVentasHoy = ventasHoy.reduce(
    (sum, v) => sum + Number(v.monto || v.total || 0),
    0
  );

  const totalGastosHoy = gastosHoy.reduce(
    (sum, g) => sum + Number(g.monto || 0),
    0
  );

  const ingresoNeto = totalVentasHoy - totalGastosHoy;

  const apartadosActivos = apartados.filter(
    (a) => a.estatus === 'activo' || a.estatus === 'Activo'
  );

  const apartadosPorVencer = apartadosActivos.filter((a) => {
    if (!a.fechaLimite) return false;

    const hoyDate = new Date(hoy);
    const limite = new Date(a.fechaLimite);
    const diff = Math.ceil((limite - hoyDate) / (1000 * 60 * 60 * 24));

    return diff >= 0 && diff <= 7;
  });

  const metaCompraUsd = 1500;
const tipoCambio = 17.5;

const metaCompraMxn = metaCompraUsd * tipoCambio;

const capitalDisponible =
  totalVentasHoy - totalGastosHoy;

const porcentaje = Math.min(
  (capitalDisponible / metaCompraMxn) * 100,
  100
);

const faltante = Math.max(
  metaCompraMxn - capitalDisponible,
  0
);

  const tarjetas = [
    {
      titulo: 'Ventas de hoy',
      valor: formatMoney(totalVentasHoy),
    },
    {
      titulo: 'Gastos de hoy',
      valor: formatMoney(totalGastosHoy),
    },
    {
      titulo: 'Ingreso neto',
      valor: formatMoney(ingresoNeto),
    },
    {
      titulo: 'Apartados activos',
      valor: apartadosActivos.length,
    },
  ];

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} mb={2}>
        Dashboard
      </Typography>

      <Card
  sx={{
    p: 3,
    borderRadius: 4,
    mb: 3,
    bgcolor: capitalDisponible >= metaCompraMxn ? '#e8f5e9' : '#ffebee',
  }}
>
  <Typography color="text.secondary" fontSize={14}>
    Capital para próxima carga
  </Typography>

  <Typography variant="h4" fontWeight={800}>
    {capitalDisponible >= metaCompraMxn
      ? '🟢 Listo para comprar'
      : `🔴 Faltan ${formatMoney(faltante)}`}
  </Typography>

  <Typography sx={{ mt: 1 }}>
    {formatMoney(capitalDisponible)} / {formatMoney(metaCompraMxn)}
  </Typography>

  <LinearProgress
    variant="determinate"
    value={porcentaje}
    sx={{
      mt: 2,
      height: 12,
      borderRadius: 10,
    }}
  />

  <Typography color="text.secondary" fontSize={13} sx={{ mt: 1 }}>
    Meta: ${metaCompraUsd} USD × {tipoCambio} = {formatMoney(metaCompraMxn)}
  </Typography>
</Card>

      <Grid container spacing={2}>
        {tarjetas.map((t) => (
          <Grid item xs={12} sm={6} md={3} key={t.titulo}>
            <Card sx={{ p: 2, borderRadius: 4 }}>
              <Typography color="text.secondary" fontSize={14}>
                {t.titulo}
              </Typography>

              <Typography variant="h5" fontWeight={700}>
                {t.valor}
              </Typography>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Card sx={{ p: 2, borderRadius: 4, mt: 3 }}>
        <Typography variant="h6" fontWeight={700} mb={1}>
          Apartados por vencer
        </Typography>

        {apartadosPorVencer.length === 0 ? (
          <Typography color="text.secondary">
            No hay apartados por vencer en los próximos 7 días.
          </Typography>
        ) : (
          <List>
            {apartadosPorVencer.map((a) => (
              <ListItem key={a.id} divider>
                <ListItemText
                  primary={a.descripcion}
                  secondary={`Vence: ${a.fechaLimite} · Saldo: ${formatMoney(
                    a.saldo
                  )}`}
                />
              </ListItem>
            ))}
          </List>
        )}
      </Card>
    </Box>
  );
}