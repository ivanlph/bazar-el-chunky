import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Fab,
  Grid,
  IconButton,
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
import EditIcon from '@mui/icons-material/Edit';
import dayjs from 'dayjs';
import ResponsiveTable from '../../components/ResponsiveTable.jsx';
import { useUser } from '../../contexts/UserContext.jsx';
import {
  actualizarHorario,
  agregarEmpleado,
  agregarHorario,
  listenEmpleados,
  listenHorarios,
} from '../../services/nominas/nominasService.js';
import { formatMoney } from '../../utils/date.js';

const empleadoInicial = { nombre: '', puesto: '', pagoHora: '' };
const horarioInicial = {
  empleadoId: '',
  fecha: dayjs().format('YYYY-MM-DD'),
  entrada: '08:00',
  salida: '17:00',
};

function calcularHoras(fecha, entrada, salida) {
  if (!fecha || !entrada || !salida) return 0;

  const inicio = dayjs(`${fecha} ${entrada}`);
  let fin = dayjs(`${fecha} ${salida}`);

  if (!fin.isAfter(inicio)) {
    fin = fin.add(1, 'day');
  }

  return Number(Math.max(0, fin.diff(inicio, 'minute') / 60).toFixed(2));
}

function rangoFechas(inicio, fin) {
  const fechas = [];
  let cursor = dayjs(inicio);
  const limite = dayjs(fin);

  while (cursor.isValid() && limite.isValid() && !cursor.isAfter(limite)) {
    fechas.push(cursor.format('YYYY-MM-DD'));
    cursor = cursor.add(1, 'day');
  }

  return fechas;
}

export default function Nominas() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { user, isAdmin } = useUser();
  const [empleados, setEmpleados] = useState([]);
  const [horarios, setHorarios] = useState([]);
  const [open, setOpen] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [periodo, setPeriodo] = useState({
    inicio: dayjs().startOf('week').format('YYYY-MM-DD'),
    fin: dayjs().endOf('week').format('YYYY-MM-DD'),
  });
  const [emp, setEmp] = useState(empleadoInicial);
  const [hora, setHora] = useState(horarioInicial);

  useEffect(() => listenEmpleados(setEmpleados), []);
  useEffect(
    () => listenHorarios(periodo.inicio, periodo.fin, setHorarios),
    [periodo.inicio, periodo.fin]
  );

  const empleadosActivos = useMemo(
    () => empleados.filter((empleado) => empleado.activo !== false),
    [empleados]
  );

  const filas = useMemo(() => {
    const fechas = rangoFechas(periodo.inicio, periodo.fin);
    const porEmpleadoFecha = new Map(
      horarios.map((horario) => [`${horario.empleadoId}-${horario.fecha}`, horario])
    );

    return fechas.flatMap((fecha) =>
      empleadosActivos.map((empleado) => {
        const horario = porEmpleadoFecha.get(`${empleado.id}-${fecha}`);
        const horas = Number(
          horario?.horas ?? calcularHoras(fecha, horario?.entrada, horario?.salida)
        );

        return {
          key: `${empleado.id}-${fecha}`,
          fecha,
          empleado,
          horario,
          horas,
          total: horas * Number(empleado.pagoHora || 0),
        };
      })
    );
  }, [empleadosActivos, horarios, periodo.fin, periodo.inicio]);

  const totales = useMemo(
    () =>
      filas.reduce(
        (sum, fila) => ({
          horas: sum.horas + Number(fila.horas || 0),
          monto: sum.monto + Number(fila.total || 0),
        }),
        { horas: 0, monto: 0 }
      ),
    [filas]
  );

  const abrirHorario = (fila) => {
    if (!isAdmin) return;

    setEditingId(fila.horario?.id || null);
    setHora({
      empleadoId: fila.empleado.id,
      fecha: fila.fecha,
      entrada: fila.horario?.entrada || '08:00',
      salida: fila.horario?.salida || '17:00',
    });
    setOpen('horario');
  };

  const cerrarDialogos = () => {
    setOpen(null);
    setEditingId(null);
    setHora(horarioInicial);
  };

  const guardarEmpleado = async () => {
    if (!isAdmin) return;

    await agregarEmpleado({
      ...emp,
      pagoHora: Number(emp.pagoHora || 0),
      sucursalId: user.sucursalId,
      usuarioId: user.uid,
    });
    setEmp(empleadoInicial);
    setOpen(null);
  };

  const guardarHorario = async () => {
    if (!isAdmin) return;

    const horas = calcularHoras(hora.fecha, hora.entrada, hora.salida);
    const data = {
      ...hora,
      horas,
      sucursalId: user.sucursalId,
      usuarioId: user.uid,
    };

    if (editingId) {
      await actualizarHorario(editingId, data);
    } else {
      await agregarHorario(data);
    }

    cerrarDialogos();
  };

  return (
    <Box>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        justifyContent="space-between"
        alignItems={{ xs: 'stretch', sm: 'center' }}
        spacing={1.5}
        mb={{ xs: 2.5, sm: 2 }}
      >
        <Box>
          <Typography variant="h5">Nóminas</Typography>
          <Typography color="text.secondary">Tarjeta de tiempo por empleado</Typography>
        </Box>

        {isAdmin && (
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
            <Button fullWidth={isMobile} onClick={() => setOpen('empleado')}>Agregar empleado</Button>
            <Button fullWidth={isMobile} onClick={() => abrirHorario({ fecha: dayjs().format('YYYY-MM-DD'), empleado: empleadosActivos[0] || {} })} disabled={!empleadosActivos.length}>
              Agregar tiempo
            </Button>
          </Stack>
        )}
      </Stack>

      {!isAdmin && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Solo administradores y superadministradores pueden modificar las tarjetas de tiempo.
        </Alert>
      )}

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
          gap: 2,
          mt: { xs: 1, sm: 0 },
          mb: 2.5,
        }}
      >
        <Box>
          <TextField fullWidth type="date" label="Inicio" value={periodo.inicio} onChange={(e) => setPeriodo({ ...periodo, inicio: e.target.value })} InputLabelProps={{ shrink: true }} />
        </Box>
        <Box>
          <TextField fullWidth type="date" label="Fin" value={periodo.fin} onChange={(e) => setPeriodo({ ...periodo, fin: e.target.value })} InputLabelProps={{ shrink: true }} />
        </Box>
      </Box>

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} mb={2}>
        <Alert severity="success" sx={{ flex: 1 }}>
          Horas del periodo: {totales.horas.toFixed(2)}
        </Alert>
        <Alert severity="success" sx={{ flex: 1 }}>
          Nómina estimada: {formatMoney(totales.monto)}
        </Alert>
      </Stack>

      {isMobile ? (
        <Stack spacing={1.5}>
          {filas.map((fila) => (
            <Card key={fila.key} sx={{ borderRadius: 2, position: 'relative' }}>
              <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                <Box sx={{ minWidth: 0, pr: isAdmin ? 5 : 0 }}>
                  <Typography fontWeight={800} sx={{ overflowWrap: 'anywhere' }}>
                    {fila.empleado.nombre}
                  </Typography>
                  <Typography color="text.secondary" fontSize={13}>
                    {fila.fecha}
                  </Typography>
                  <Typography color="text.secondary" fontSize={13} sx={{ overflowWrap: 'anywhere' }}>
                    {fila.empleado.puesto || 'Sin puesto'}
                  </Typography>
                </Box>

                {isAdmin && (
                  <IconButton
                    size="small"
                    onClick={() => abrirHorario(fila)}
                    sx={{
                      position: 'absolute',
                      top: 10,
                      right: 10,
                      width: 34,
                      height: 34,
                    }}
                  >
                    <EditIcon fontSize="small" />
                  </IconButton>
                )}

                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                    gap: 1.25,
                    mt: 1.25,
                  }}
                >
                  <Box>
                    <Typography color="text.secondary" fontSize={12}>Entrada</Typography>
                    <Typography fontWeight={700}>{fila.horario?.entrada || '-'}</Typography>
                  </Box>
                  <Box>
                    <Typography color="text.secondary" fontSize={12}>Salida</Typography>
                    <Typography fontWeight={700}>{fila.horario?.salida || '-'}</Typography>
                  </Box>
                  <Box>
                    <Typography color="text.secondary" fontSize={12}>Horas</Typography>
                    <Typography fontWeight={700}>{fila.horas ? fila.horas.toFixed(2) : '-'}</Typography>
                  </Box>
                  <Box>
                    <Typography color="text.secondary" fontSize={12}>Pago/Hora</Typography>
                    <Typography fontWeight={700}>{formatMoney(fila.empleado.pagoHora)}</Typography>
                  </Box>
                  <Box sx={{ gridColumn: '1 / -1' }}>
                    <Typography color="text.secondary" fontSize={12}>Total</Typography>
                    <Typography fontWeight={800}>{fila.total ? formatMoney(fila.total) : '-'}</Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          ))}

          {!filas.length && (
            <Card sx={{ p: 2, borderRadius: 2 }}>
              <Typography color="text.secondary">
                Agrega empleados para empezar a capturar tarjetas de tiempo.
              </Typography>
            </Card>
          )}
        </Stack>
      ) : (
        <ResponsiveTable minWidth={920}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Fecha</TableCell>
                <TableCell>Empleado</TableCell>
                <TableCell>Puesto</TableCell>
                <TableCell>Entrada</TableCell>
                <TableCell>Salida</TableCell>
                <TableCell align="right">Horas</TableCell>
                <TableCell align="right">Pago/Hora</TableCell>
                <TableCell align="right">Total</TableCell>
                {isAdmin && <TableCell align="right">Editar</TableCell>}
              </TableRow>
            </TableHead>
            <TableBody>
              {filas.map((fila) => (
                <TableRow key={fila.key} hover>
                  <TableCell>{fila.fecha}</TableCell>
                  <TableCell>{fila.empleado.nombre}</TableCell>
                  <TableCell>{fila.empleado.puesto || '-'}</TableCell>
                  <TableCell>{fila.horario?.entrada || '-'}</TableCell>
                  <TableCell>{fila.horario?.salida || '-'}</TableCell>
                  <TableCell align="right">{fila.horas ? fila.horas.toFixed(2) : '-'}</TableCell>
                  <TableCell align="right">{formatMoney(fila.empleado.pagoHora)}</TableCell>
                  <TableCell align="right">{fila.total ? formatMoney(fila.total) : '-'}</TableCell>
                  {isAdmin && (
                    <TableCell align="right">
                      <IconButton size="small" onClick={() => abrirHorario(fila)}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  )}
                </TableRow>
              ))}

              {!filas.length && (
                <TableRow>
                  <TableCell colSpan={isAdmin ? 9 : 8}>
                    Agrega empleados para empezar a capturar tarjetas de tiempo.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </ResponsiveTable>
      )}

      {isAdmin && !isMobile && (
        <Fab
          color="primary"
          sx={{ position: 'fixed', right: { xs: 16, sm: 24, md: 32 }, bottom: { xs: 16, sm: 24, md: 32 } }}
          onClick={() => abrirHorario({ fecha: dayjs().format('YYYY-MM-DD'), empleado: empleadosActivos[0] || {} })}
          disabled={!empleadosActivos.length}
        >
          <AddIcon />
        </Fab>
      )}

      <Dialog open={open === 'empleado'} onClose={cerrarDialogos} fullScreen={isMobile} fullWidth maxWidth="sm">
        <DialogTitle>Agregar empleado</DialogTitle>
        <DialogContent sx={{ display: 'grid', gap: 2, pt: 1 }}>
          <TextField label="Nombre" value={emp.nombre} onChange={(e) => setEmp({ ...emp, nombre: e.target.value })} />
          <TextField label="Puesto" value={emp.puesto} onChange={(e) => setEmp({ ...emp, puesto: e.target.value })} />
          <TextField label="Pago por hora" type="number" value={emp.pagoHora} onChange={(e) => setEmp({ ...emp, pagoHora: e.target.value })} />
        </DialogContent>
        <DialogActions>
          <Button variant="text" onClick={cerrarDialogos}>
            Cancelar
          </Button>
          <Button onClick={guardarEmpleado} disabled={!emp.nombre || !emp.pagoHora}>
            Guardar
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={open === 'horario'} onClose={cerrarDialogos} fullScreen={isMobile} fullWidth maxWidth="sm">
        <DialogTitle>{editingId ? 'Editar tiempo' : 'Agregar tiempo'}</DialogTitle>
        <DialogContent sx={{ display: 'grid', gap: 2, pt: 1 }}>
          <TextField select label="Empleado" value={hora.empleadoId} onChange={(e) => setHora({ ...hora, empleadoId: e.target.value })}>
            {empleadosActivos.map((e) => (
              <MenuItem key={e.id} value={e.id}>
                {e.nombre}
              </MenuItem>
            ))}
          </TextField>
          <TextField type="date" label="Fecha" value={hora.fecha} onChange={(e) => setHora({ ...hora, fecha: e.target.value })} InputLabelProps={{ shrink: true }} />
          <TextField type="time" label="Entrada" value={hora.entrada} onChange={(e) => setHora({ ...hora, entrada: e.target.value })} InputLabelProps={{ shrink: true }} />
          <TextField type="time" label="Salida" value={hora.salida} onChange={(e) => setHora({ ...hora, salida: e.target.value })} InputLabelProps={{ shrink: true }} />
          <Alert severity="info">
            Horas calculadas: {calcularHoras(hora.fecha, hora.entrada, hora.salida).toFixed(2)}
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button variant="text" onClick={cerrarDialogos}>
            Cancelar
          </Button>
          <Button onClick={guardarHorario} disabled={!hora.empleadoId || !hora.fecha || !hora.entrada || !hora.salida}>
            Guardar tiempo
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

