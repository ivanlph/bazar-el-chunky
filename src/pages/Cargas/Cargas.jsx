import { useEffect, useState } from 'react';
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
  useMediaQuery,
  useTheme,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { Link } from 'react-router-dom';
import { createCarga, listenCargas } from '../../services/cargas/cargasService.js';

const initialForm = {
  folio: '',
  descripcion: '',
  fecha: '',
  gasolinaUsd: '',
  hotelUsd: '',
  comidaUsd: '',
  gasolinaMxn: '',
  rentaTrailaMxn: '',
  aduanaMxn: '',
  ayudanteMxn: '',
  otrosMxn: '',
  notas: '',
  tipoCambio: '17.5',
};

export default function Cargas() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [cargas, setCargas] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(initialForm);

  useEffect(() => listenCargas(setCargas), []);

  const save = async () => {
    await createCarga({
      ...form,
      gasolinaUsd: Number(form.gasolinaUsd || 0),
      hotelUsd: Number(form.hotelUsd || 0),
      comidaUsd: Number(form.comidaUsd || 0),
      gasolinaMxn: Number(form.gasolinaMxn || 0),
      rentaTrailaMxn: Number(form.rentaTrailaMxn || 0),
      aduanaMxn: Number(form.aduanaMxn || 0),
      ayudanteMxn: Number(form.ayudanteMxn || 0),
      otrosMxn: Number(form.otrosMxn || 0),
      tipoCambio: Number(form.tipoCambio || 17.5),
    });

    setForm(initialForm);
    setOpen(false);
  };

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} mb={2}>
        Cargas
      </Typography>

      <Grid container spacing={2}>
        {cargas.map((c) => {
          const gastosUsd =
            Number(c.gasolinaUsd || 0) +
            Number(c.hotelUsd || 0) +
            Number(c.comidaUsd || 0);

          const gastosMxn =
            Number(c.gasolinaMxn || 0) +
            Number(c.rentaTrailaMxn || 0) +
            Number(c.aduanaMxn || 0) +
            Number(c.ayudanteMxn || 0) +
            Number(c.otrosMxn || 0);

          return (
            <Grid item xs={12} md={6} lg={4} key={c.id}>
              <Card
                component={Link}
                to={`/cargas/${c.id}`}
                sx={{
                  p: 2,
                  borderRadius: 2,
                  display: 'block',
                  textDecoration: 'none',
                  color: 'inherit',
                }}
              >
                <Typography fontWeight={700} noWrap>{c.folio}</Typography>
                <Typography color="text.secondary" sx={{ overflowWrap: 'anywhere' }}>{c.descripcion}</Typography>
                <Typography color="text.secondary">{c.fecha}</Typography>

                <Typography sx={{ mt: 1 }}>
                  Gastos USA: ${gastosUsd.toFixed(2)} USD
                </Typography>

                <Typography>
                  Gastos México: ${gastosMxn.toFixed(2)} MXN
                </Typography>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      <Fab
        color="primary"
        onClick={() => setOpen(true)}
        sx={{ position: 'fixed', right: { xs: 16, sm: 24 }, bottom: { xs: 16, sm: 24 } }}
      >
        <AddIcon />
      </Fab>

      <Dialog open={open} onClose={() => setOpen(false)} fullScreen={isMobile} fullWidth maxWidth="sm">
        <DialogTitle>Nueva carga</DialogTitle>

        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField
                label="Folio"
                value={form.folio}
                onChange={(e) => setForm({ ...form, folio: e.target.value })}
                fullWidth
                />

            <TextField
                label="Descripción"
                value={form.descripcion}
                onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
                fullWidth
                />
            <TextField type="date" label="Fecha" value={form.fecha} onChange={(e) => setForm({ ...form, fecha: e.target.value })} fullWidth InputLabelProps={{ shrink: true }} />

            <Typography fontWeight={700}>Gastos USA</Typography>
            <TextField label="Gasolina USA" type="number" value={form.gasolinaUsd} onChange={(e) => setForm({ ...form, gasolinaUsd: e.target.value })} fullWidth />
            <TextField label="Hotel" type="number" value={form.hotelUsd} onChange={(e) => setForm({ ...form, hotelUsd: e.target.value })} fullWidth />
            <TextField label="Comida" type="number" value={form.comidaUsd} onChange={(e) => setForm({ ...form, comidaUsd: e.target.value })} fullWidth />
            <TextField label="Tipo de cambio" type="number" value={form.tipoCambio} onChange={(e) => setForm({ ...form, tipoCambio: e.target.value })} fullWidth/>
           
            <Typography fontWeight={700}>Gastos México</Typography>
            <TextField label="Gasolina México" type="number" value={form.gasolinaMxn} onChange={(e) => setForm({ ...form, gasolinaMxn: e.target.value })} fullWidth />
            <TextField label="Renta traila" type="number" value={form.rentaTrailaMxn} onChange={(e) => setForm({ ...form, rentaTrailaMxn: e.target.value })} fullWidth />
            <TextField label="Aduana" type="number" value={form.aduanaMxn} onChange={(e) => setForm({ ...form, aduanaMxn: e.target.value })} fullWidth />
            <TextField label="Ayudante" type="number" value={form.ayudanteMxn} onChange={(e) => setForm({ ...form, ayudanteMxn: e.target.value })} fullWidth />
            <TextField label="Otros" type="number" value={form.otrosMxn} onChange={(e) => setForm({ ...form, otrosMxn: e.target.value })} fullWidth />

            <TextField label="Notas" value={form.notas} onChange={(e) => setForm({ ...form, notas: e.target.value })} multiline rows={3} fullWidth />
          </Stack>
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancelar</Button>
          <Button variant="contained" onClick={save}>
            Guardar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

