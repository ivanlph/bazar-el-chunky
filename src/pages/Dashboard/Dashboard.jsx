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
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';
import { collection, doc, onSnapshot } from 'firebase/firestore';
import { db } from '../../services/firebase/firebase.js';
import { formatMoney } from '../../utils/money.js';
import { todayKey } from '../../utils/date.js';

const metasDefault = {
  dia: 0,
  semana: 0,
  mes: 0,
  anio: 0,
};

function toDate(fecha) {
  return new Date(`${fecha}T00:00:00`);
}

function dateKey(date) {
  return date.toISOString().slice(0, 10);
}

function getPeriodoRango(periodo) {
  const hoy = toDate(todayKey());

  if (periodo === 'dia') {
    return {
      inicio: todayKey(),
      fin: todayKey(),
      label: 'Hoy',
    };
  }

  if (periodo === 'semana') {
    const dia = hoy.getDay();
    const diasDesdeMartes = dia >= 2 ? dia - 2 : 5 + dia;

    const inicio = new Date(hoy);
    inicio.setDate(hoy.getDate() - diasDesdeMartes);

    const fin = new Date(inicio);
    fin.setDate(inicio.getDate() + 5);

    return {
      inicio: dateKey(inicio),
      fin: dateKey(fin),
      label: `${dateKey(inicio)} a ${dateKey(fin)}`,
    };
  }

  if (periodo === 'mes') {
    const year = hoy.getFullYear();
    const month = hoy.getMonth();

    const inicio = new Date(year, month, 1);
    const fin = new Date(year, month + 1, 0);

    return {
      inicio: dateKey(inicio),
      fin: dateKey(fin),
      label: `${dateKey(inicio)} a ${dateKey(fin)}`,
    };
  }

  const year = hoy.getFullYear();

  return {
    inicio: `${year}-01-01`,
    fin: `${year}-12-31`,
    label: `${year}`,
  };
}

function estaEnRango(fecha, inicio, fin) {
  if (!fecha) return false;
  return fecha >= inicio && fecha <= fin;
}

export default function Dashboard() {
  const [periodo, setPeriodo] = useState('semana');
  const [ventas, setVentas] = useState([]);
  const [gastos, setGastos] = useState([]);
  const [apartados, setApartados] = useState([]);
  const [cargas, setCargas] = useState([]);
  const [compras, setCompras] = useState([]);
  const [metas, setMetas] = useState(metasDefault);

  useEffect(() => {
    const unsubVentas = onSnapshot(collection(db, 'ventas'), (snap) => {
      setVentas(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });

    const unsubGastos = onSnapshot(collection(db, 'gastosDiarios'), (snap) => {
      setGastos(
        snap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .filter((gasto) => gasto.tipo !== 'nomina')
      );
    });

    const unsubApartados = onSnapshot(collection(db, 'apartados'), (snap) => {
      setApartados(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });

    const unsubCargas = onSnapshot(collection(db, 'cargas'), (snap) => {
      setCargas(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });

    const unsubCompras = onSnapshot(collection(db, 'cargaCompras'), (snap) => {
      setCompras(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    const unsubConfig = onSnapshot(doc(db, 'configuracion', 'dashboard'), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
    
        setMetas({
          dia: Number(data.metaDia || 0),
          semana: Number(data.metaSemana || 0),
          mes: Number(data.metaMes || 0),
          anio: Number(data.metaAnio || 0),
        });
      }
    });

    return () => {
      unsubVentas();
      unsubGastos();
      unsubApartados();
      unsubCargas();
      unsubCompras();
      unsubConfig();
    };
  }, []);

  const rango = getPeriodoRango(periodo);

  const ventasPeriodo = ventas.filter((v) =>
    estaEnRango(v.fecha, rango.inicio, rango.fin)
  );

  const gastosPeriodo = gastos.filter((g) =>
    estaEnRango(g.fecha, rango.inicio, rango.fin)
  );

  const cargasPeriodo = cargas.filter((c) =>
    estaEnRango(c.fecha, rango.inicio, rango.fin)
  );

  const idsCargasPeriodo = cargasPeriodo.map((c) => c.id);

  const comprasPeriodo = compras.filter((c) =>
    idsCargasPeriodo.includes(c.cargaId)
  );

  const totalVentas = ventasPeriodo.reduce(
    (sum, v) => sum + Number(v.monto || v.total || 0),
    0
  );

  const totalGastos = gastosPeriodo.reduce(
    (sum, g) => sum + Number(g.monto || 0),
    0
  );

  const totalComprasUsd = comprasPeriodo.reduce(
    (sum, c) => sum + Number(c.costoSubastaUsd || 0),
    0
  );

  const totalGastosCargasMxn = cargasPeriodo.reduce((sum, c) => {
    return (
      sum +
      Number(c.gasolinaMxn || 0) +
      Number(c.rentaTrailaMxn || 0) +
      Number(c.aduanaMxn || 0) +
      Number(c.ayudanteMxn || 0) +
      Number(c.otrosMxn || 0)
    );
  }, 0);

  const totalGastosCargasUsd = cargasPeriodo.reduce((sum, c) => {
    return (
      sum +
      Number(c.gasolinaUsd || 0) +
      Number(c.hotelUsd || 0) +
      Number(c.comidaUsd || 0)
    );
  }, 0);

  const netoOperativo = totalVentas - totalGastos;

  const meta = Number(metas[periodo] || 0);

  const avanceMeta =
    meta > 0 ? Math.min((totalVentas / meta) * 100, 100) : 0;
  
  const faltanteMeta =
    meta > 0 ? Math.max(meta - totalVentas, 0) : 0;

  const apartadosActivos = apartados.filter(
    (a) => a.estatus === 'activo' || a.estatus === 'Activo'
  );

  const pendienteApartados = apartadosActivos.reduce(
    (sum, a) => sum + Number(a.saldo || 0),
    0
  );

  const apartadosPorVencer = apartadosActivos.filter((a) => {
    if (!a.fechaLimite) return false;

    const hoy = toDate(todayKey());
    const limite = toDate(a.fechaLimite);
    const diff = Math.ceil((limite - hoy) / (1000 * 60 * 60 * 24));

    return diff >= 0 && diff <= 7;
  });

  const tarjetas = [
    {
      titulo: 'Ventas',
      valor: formatMoney(totalVentas),
    },
    {
      titulo: 'Gastos diarios',
      valor: formatMoney(totalGastos),
    },
    {
      titulo: 'Neto operativo',
      valor: formatMoney(netoOperativo),
    },
    {
      titulo: 'Compras subasta',
      valor: `$${totalComprasUsd.toFixed(2)} USD`,
    },
    {
      titulo: 'Gastos cargas USD',
      valor: `$${totalGastosCargasUsd.toFixed(2)} USD`,
    },
    {
      titulo: 'Gastos cargas MXN',
      valor: formatMoney(totalGastosCargasMxn),
    },
    {
      titulo: 'Apartados activos',
      valor: apartadosActivos.length,
    },
    {
      titulo: 'Pendiente por cobrar',
      valor: formatMoney(pendienteApartados),
    },
  ];

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} mb={1}>
        Dashboard
      </Typography>

      <Typography color="text.secondary" mb={2}>
        Periodo: {rango.label}
      </Typography>

      <ToggleButtonGroup
        value={periodo}
        exclusive
        onChange={(e, value) => value && setPeriodo(value)}
        sx={{ mb: 2, flexWrap: 'wrap' }}
      >
        <ToggleButton value="dia">Día</ToggleButton>
        <ToggleButton value="semana">Semana</ToggleButton>
        <ToggleButton value="mes">Mes</ToggleButton>
        <ToggleButton value="anio">Año</ToggleButton>
      </ToggleButtonGroup>

      <Card sx={{ p: 3, borderRadius: 2, mb: 3 }}>
        <Typography color="text.secondary" fontSize={14}>
          Meta de venta
        </Typography>

        <Typography variant="h5" fontWeight={800}>
          {faltanteMeta === 0
            ? '🟢 Meta alcanzada'
            : `🔴 Faltan ${formatMoney(faltanteMeta)}`}
        </Typography>

        <Typography sx={{ mt: 1 }}>
        {meta > 0
            ? `${formatMoney(totalVentas)} / ${formatMoney(meta)}`
            : 'Configura una meta para este periodo'}
        </Typography>

        <LinearProgress
          variant="determinate"
          value={avanceMeta}
          sx={{
            mt: 2,
            height: 12,
            borderRadius: 2,
          }}
        />
      </Card>

      <Grid container spacing={2}>
        {tarjetas.map((t) => (
          <Grid item xs={12} sm={6} md={3} key={t.titulo}>
            <Card sx={{ p: 2, borderRadius: 2 }}>
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

      <Card sx={{ p: 2, borderRadius: 2, mt: 3 }}>
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

