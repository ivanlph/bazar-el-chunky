import { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Button,
  Card,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Fab,
  Grid,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { useParams } from 'react-router-dom';
import { collection, doc, onSnapshot } from 'firebase/firestore';
import { db } from '../../services/firebase/firebase.js';
import {
  createCompra,
  listenComprasPorCarga,
} from '../../services/cargas/cargasService.js';

const compraInicial = {
  descripcion: '',
  compania: '',
  tamano: '',
  interiorExterior: '',
  nivelLlenado: '',
  costoSubastaUsd: '',
  notas: '',
};

const moneyUSD = (value) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(Number(value || 0));

const moneyMXN = (value) =>
  new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
  }).format(Number(value || 0));

export default function CargaDetalle() {
  const { id } = useParams();
  const [carga, setCarga] = useState(null);
  const [compras, setCompras] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(compraInicial);

  useEffect(() => {
    const unsubCarga = onSnapshot(doc(db, 'cargas', id), (snap) => {
      setCarga(snap.exists() ? { id: snap.id, ...snap.data() } : null);
    });

    const unsubCompras = listenComprasPorCarga(id, setCompras);

    return () => {
      unsubCarga();
      unsubCompras();
    };
  }, [id]);

  const totales = useMemo(() => {
    const n = (value) => Number(value || 0);
  
    const comprasUsd = compras.reduce(
      (sum, c) => sum + n(c.costoSubastaUsd),
      0
    );
  
    const gastosUsd =
    n(carga?.gasolinaUsd) +
    n(carga?.hotelUsd) +
    n(carga?.comidaUsd);
  
  const gastosMxn =
    n(carga?.gasolinaMxn) +
    n(carga?.rentaTrailaMxn) +
    n(carga?.aduanaMxn) +
    n(carga?.ayudanteMxn) +
    n(carga?.otrosMxn);
  
    const tipoCambio = n(carga?.tipoCambio) || 17.5;
  
    const totalUsd = comprasUsd + gastosUsd;
    const totalMxn = totalUsd * tipoCambio + gastosMxn;
  
    return {
      comprasUsd,
      gastosUsd,
      gastosMxn,
      tipoCambio,
      totalUsd,
      totalMxn,
    };
  }, [carga, compras]);

  const saveCompra = async () => {
    await createCompra({
      cargaId: id,
      ...form,
      costoSubastaUsd: Number(form.costoSubastaUsd || 0),
    });

    setForm(compraInicial);
    setOpen(false);
  };

  if (!carga) {
    return <Typography>Cargando...</Typography>;
  }

  return (
    <Box>
      <Typography variant="h5" fontWeight={700}>
        {carga.folio}
      </Typography>
      <Typography fontWeight={700}>
  {carga.descripcion}
</Typography>

<Typography color="text.secondary">
  {carga.compania}
</Typography>

{carga.tamano && (
  <Typography variant="body2">
    Tamaño: {c.tamano}
  </Typography>
)}

{carga.interiorExterior && (
  <Typography variant="body2">
    {c.interiorExterior}
  </Typography>
)}

{carga.nivelLlenado && (
  <Typography variant="body2">
    Llenado: {c.nivelLlenado}
  </Typography>
)}
     <Typography color="text.secondary" mb={2}>
        {carga.fecha}
      </Typography>

      <Grid container spacing={2} mb={2}>
        <Grid item xs={12} md={4}>
          <Card sx={{ p: 2, borderRadius: 4 }}>
            <Typography color="text.secondary">Compras</Typography>
            <Typography variant="h5" fontWeight={700}>
            {moneyUSD(totales.comprasUsd)}
            </Typography>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card sx={{ p: 2, borderRadius: 4 }}>
            <Typography color="text.secondary">Gastos USA</Typography>
            <Typography variant="h5" fontWeight={700}>
            {moneyUSD(totales.gastosUsd)}
            </Typography>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card sx={{ p: 2, borderRadius: 4 }}>
            <Typography color="text.secondary">Gastos México</Typography>
            <Typography variant="h5" fontWeight={700}>
            {moneyMXN(totales.gastosMxn)}
            </Typography>
          </Card>
        </Grid>
      </Grid>
          <Card
          sx={{
            p: 2,
            borderRadius: 5,
            bgcolor: '#e8f5e9',
          }}
        >
      <Typography>Total de la carga</Typography>

      <Typography variant="h5" fontWeight={800}>
        {moneyMXN(totales.totalMxn)}
      </Typography>

      <Typography fontSize={13} color="text.secondary">
        {moneyUSD(totales.totalUsd)} × {totales.tipoCambio} +{' '}
        {moneyMXN(totales.gastosMxn)}
      </Typography>
    </Card>
      <Card sx={{ p: 2, borderRadius: 4, mb: 2 }}>
        <Typography variant="h6" fontWeight={700} mb={1}>
          Gastos del viaje
        </Typography>

        <Typography>Gasolina USA: ${Number(carga.gasolinaUsd || 0).toFixed(2)} USD</Typography>
        <Typography>Hotel: ${Number(carga.hotelUsd || 0).toFixed(2)} USD</Typography>
        <Typography>Comida: ${Number(carga.comidaUsd || 0).toFixed(2)} USD</Typography>
        <Typography>Gasolina México: ${Number(carga.gasolinaMxn || 0).toFixed(2)} MXN</Typography>
        <Typography>Renta traila: ${Number(carga.rentaTrailaMxn || 0).toFixed(2)} MXN</Typography>
        <Typography>Aduana: ${Number(carga.aduanaMxn || 0).toFixed(2)} MXN</Typography>
        <Typography>Ayudante: ${Number(carga.ayudanteMxn || 0).toFixed(2)} MXN</Typography>
        <Typography>Otros: ${Number(carga.otrosMxn || 0).toFixed(2)} MXN</Typography>

        {carga.notas && (
          <Typography color="text.secondary" mt={1}>
            {carga.notas}
          </Typography>
        )}
      </Card>

      <Typography variant="h6" fontWeight={700} mb={1}>
        Compras
      </Typography>

      <Grid container spacing={2}>
        {compras.map((c) => (
          <Grid item xs={12} md={6} key={c.id}>
            <Card sx={{ p: 2, borderRadius: 4 }}>
              <Typography fontWeight={700}>{c.descripcion}</Typography>
              <Typography color="text.secondary">{c.compania}</Typography>
              <Typography>${Number(c.costoSubastaUsd || 0).toFixed(2)} USD</Typography>

              {c.notas && (
                <Typography color="text.secondary" mt={1}>
                  {c.notas}
                </Typography>
              )}
            </Card>
          </Grid>
        ))}
      </Grid>

      <Fab
        color="primary"
        onClick={() => setOpen(true)}
        sx={{ position: 'fixed', right: 24, bottom: 24 }}
      >
        <AddIcon />
      </Fab>

      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Agregar compra</DialogTitle>

        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField label="Descripción" value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} fullWidth />
            <TextField label="Compañía" value={form.compania} onChange={(e) => setForm({ ...form, compania: e.target.value })} fullWidth />
            <TextField
  label="Tamaño"
  value={form.tamano}
  onChange={(e) =>
    setForm({ ...form, tamano: e.target.value })
  }
  placeholder="10x20"
  fullWidth
/>

<TextField
  label="Interior / Exterior"
  value={form.interiorExterior}
  onChange={(e) =>
    setForm({
      ...form,
      interiorExterior: e.target.value,
    })
  }
  placeholder="Interior"
  fullWidth
/>

<TextField
  label="Nivel de llenado"
  value={form.nivelLlenado}
  onChange={(e) =>
    setForm({
      ...form,
      nivelLlenado: e.target.value,
    })
  }
  placeholder="Llena"
  fullWidth
/>            
            <TextField label="Costo subasta USD" type="number" value={form.costoSubastaUsd} onChange={(e) => setForm({ ...form, costoSubastaUsd: e.target.value })} fullWidth />
            <TextField label="Notas" value={form.notas} onChange={(e) => setForm({ ...form, notas: e.target.value })} multiline rows={3} fullWidth />
          </Stack>
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancelar</Button>
          <Button variant="contained" onClick={saveCompra}>
            Guardar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}