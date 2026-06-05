import { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Fab,
  MenuItem,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import ResponsiveTable from '../../components/ResponsiveTable.jsx';
import { agregarGasto, listenGastosDelDia } from '../../services/gastos/gastosService.js';
import { formatMoney, todayKey } from '../../utils/date.js';
import { useUser } from '../../contexts/UserContext.jsx';

const cats = ['Operación', 'Transporte', 'Alimentación', 'Herramientas', 'Limpieza', 'Otros'];

export default function Gastos() {
  const fecha = todayKey();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { user } = useUser();
  const [gastos, setGastos] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ monto: '', motivo: '', categoria: 'Otros' });

  useEffect(() => listenGastosDelDia(fecha, setGastos), [fecha]);

  const total = useMemo(
    () => gastos.reduce((s, g) => s + Number(g.monto || 0), 0),
    [gastos]
  );

  const save = async () => {
    await agregarGasto({
      ...form,
      monto: Number(form.monto),
      fecha,
      usuarioId: user.uid,
      sucursalId: user.sucursalId,
    });
    setForm({ monto: '', motivo: '', categoria: 'Otros' });
    setOpen(false);
  };

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between">
        <Box>
          <Typography variant="h5">Gastos diarios</Typography>
          <Typography color="text.secondary">Estos sí afectan el corte diario.</Typography>
        </Box>
      </Stack>

      <Card sx={{ my: 2 }}>
        <CardContent>
          <Typography>Total gastos hoy</Typography>
          <Typography variant="h4">{formatMoney(total)}</Typography>
        </CardContent>
      </Card>

      {isMobile ? (
        <Stack spacing={1.5}>
          {gastos.map((g) => (
            <Card key={g.id} sx={{ borderRadius: 2 }}>
              <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={2}>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography fontWeight={800} sx={{ overflowWrap: 'anywhere' }}>
                      {g.motivo || 'Sin motivo'}
                    </Typography>
                    <Typography color="text.secondary" fontSize={13}>
                      {g.categoria || 'Sin categoría'}
                    </Typography>
                  </Box>
                  <Typography fontWeight={800} sx={{ flexShrink: 0 }}>
                    {formatMoney(g.monto)}
                  </Typography>
                </Stack>
              </CardContent>
            </Card>
          ))}

          {!gastos.length && (
            <Card sx={{ p: 2, borderRadius: 2 }}>
              <Typography color="text.secondary">Sin gastos registrados hoy.</Typography>
            </Card>
          )}
        </Stack>
      ) : (
        <ResponsiveTable minWidth={560}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Motivo</TableCell>
                <TableCell>Categoría</TableCell>
                <TableCell align="right">Monto</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {gastos.map((g) => (
                <TableRow key={g.id}>
                  <TableCell>{g.motivo}</TableCell>
                  <TableCell>{g.categoria}</TableCell>
                  <TableCell align="right">{formatMoney(g.monto)}</TableCell>
                </TableRow>
              ))}

              {!gastos.length && (
                <TableRow>
                  <TableCell colSpan={3}>Sin gastos registrados hoy.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </ResponsiveTable>
      )}

      <Fab
        color="primary"
        sx={{ position: 'fixed', right: { xs: 16, sm: 24, md: 32 }, bottom: { xs: 16, sm: 24, md: 32 } }}
        onClick={() => setOpen(true)}
      >
        <AddIcon />
      </Fab>

      <Dialog open={open} onClose={() => setOpen(false)} fullScreen={isMobile} fullWidth maxWidth="sm">
        <DialogTitle>Agregar gasto</DialogTitle>
        <DialogContent sx={{ display: 'grid', gap: 2, pt: 1 }}>
          <TextField label="Monto" type="number" value={form.monto} onChange={(e) => setForm({ ...form, monto: e.target.value })} />
          <TextField label="Motivo" value={form.motivo} onChange={(e) => setForm({ ...form, motivo: e.target.value })} />
          <TextField select label="Categoría" value={form.categoria} onChange={(e) => setForm({ ...form, categoria: e.target.value })}>
            {cats.map((c) => (
              <MenuItem key={c} value={c}>
                {c}
              </MenuItem>
            ))}
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button variant="text" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button onClick={save}>Guardar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

