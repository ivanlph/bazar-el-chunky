import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Fab,
  FormControlLabel,
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
import LoginIcon from '@mui/icons-material/Login';
import LogoutIcon from '@mui/icons-material/Logout';
import PaymentsIcon from '@mui/icons-material/Payments';
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
  entrada: '',
  salida: '',
  pagado: false,
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

function horaActual() {
  return dayjs().format('HH:mm');
}

function estaPagado(horario) {
  if (!horario) return false;
  if (typeof horario.pagado === 'boolean') return horario.pagado;
  return Boolean(horario.salida);
}

export default function Nominas() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { user, isAdmin, canManagePayroll } = useUser();
  const [empleados, setEmpleados] = useState([]);
  const [horarios, setHorarios] = useState([]);
  const [open, setOpen] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [savingKey, setSavingKey] = useState('');
  const [error, setError] = useState('');
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

  const horariosPorEmpleadoFecha = useMemo(
    () =>
      new Map(
        horarios.map((horario) => [`${horario.empleadoId}-${horario.fecha}`, horario])
      ),
    [horarios]
  );

  const filas = useMemo(() => {
    const fechas = rangoFechas(periodo.inicio, periodo.fin);

    return fechas.flatMap((fecha) =>
      empleadosActivos.map((empleado) => {
        const horario = horariosPorEmpleadoFecha.get(`${empleado.id}-${fecha}`);
        const pagado = estaPagado(horario);
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
          pagado,
          estadoPago: horario ? (pagado ? 'pagado' : 'pendiente') : 'sinTiempo',
        };
      })
    );
  }, [empleadosActivos, horariosPorEmpleadoFecha, periodo.fin, periodo.inicio]);

  const totales = useMemo(
    () =>
      filas.reduce(
        (sum, fila) => ({
          horas: sum.horas + Number(fila.horas || 0),
          monto: sum.monto + Number(fila.total || 0),
          pagado: sum.pagado + (fila.pagado ? Number(fila.total || 0) : 0),
          pendiente: sum.pendiente + (fila.estadoPago === 'pendiente' ? Number(fila.total || 0) : 0),
        }),
        { horas: 0, monto: 0, pagado: 0, pendiente: 0 }
      ),
    [filas]
  );

  const filasHoy = useMemo(() => {
    const fecha = dayjs().format('YYYY-MM-DD');

    return empleadosActivos.map((empleado) => {
      const horario = horariosPorEmpleadoFecha.get(`${empleado.id}-${fecha}`);
      const pagado = estaPagado(horario);
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
        pagado,
        estadoPago: horario ? (pagado ? 'pagado' : 'pendiente') : 'sinTiempo',
      };
    });
  }, [empleadosActivos, horariosPorEmpleadoFecha]);

  const abrirHorario = (fila) => {
    if (!isAdmin) return;

    setEditingId(fila.horario?.id || null);
    setHora({
      empleadoId: fila.empleado.id,
      fecha: fila.fecha,
      entrada: fila.horario?.entrada || '08:00',
      salida: fila.horario?.salida || '17:00',
      pagado: fila.horario ? estaPagado(fila.horario) : false,
    });
    setOpen('horario');
  };

  const cerrarDialogos = () => {
    setOpen(null);
    setEditingId(null);
    setHora(horarioInicial);
    setError('');
  };

  const guardarRegistroRapido = async (fila, cambios) => {
    if (!canManagePayroll) return;
    const actionKey = `${fila.key}-${Object.keys(cambios).join('-')}`;

    setSavingKey(actionKey);
    setError('');

    try {
      const actual = fila.horario || {};
      const data = {
        empleadoId: fila.empleado.id,
        fecha: fila.fecha,
        entrada: actual.entrada || '',
        salida: actual.salida || '',
        pagado: estaPagado(actual),
        ...cambios,
        sucursalId: user.sucursalId,
        usuarioId: user.uid,
      };

      const horas = calcularHoras(data.fecha, data.entrada, data.salida);
      const total = horas * Number(fila.empleado.pagoHora || 0);

      data.horas = horas;
      data.pagoMontoMxn = data.pagado ? total : 0;
      data.pagoOrigen = data.pagado ? 'fondoCaja' : '';

      if (fila.horario?.id) {
        await actualizarHorario(fila.horario.id, data);
      } else {
        await agregarHorario(data);
      }
    } catch (err) {
      console.error('Error al guardar horario:', err);
      setError(err?.message || 'No se pudo guardar el horario.');
    } finally {
      setSavingKey('');
    }
  };

  const marcarEntrada = (fila) =>
    guardarRegistroRapido(fila, {
      entrada: horaActual(),
      salida: fila.horario?.salida || '',
      pagado: estaPagado(fila.horario),
    });

  const marcarSalida = (fila) =>
    guardarRegistroRapido(fila, {
      entrada: fila.horario?.entrada || horaActual(),
      salida: horaActual(),
      pagado: estaPagado(fila.horario),
    });

  const marcarPagado = (fila) =>
    guardarRegistroRapido(fila, {
      entrada: fila.horario?.entrada || '',
      salida: fila.horario?.salida || '',
      pagado: true,
    });

  const guardarEmpleado = async () => {
    if (!isAdmin) return;

    setSavingKey('empleado');
    setError('');

    try {
      await agregarEmpleado({
        ...emp,
        pagoHora: Number(emp.pagoHora || 0),
        sucursalId: user.sucursalId,
        usuarioId: user.uid,
      });
      setEmp(empleadoInicial);
      setOpen(null);
    } catch (err) {
      console.error('Error al guardar empleado:', err);
      setError(err?.message || 'No se pudo guardar el empleado.');
    } finally {
      setSavingKey('');
    }
  };

  const guardarHorario = async () => {
    if (!isAdmin) return;

    setSavingKey('horario');
    setError('');

    try {
      const horas = calcularHoras(hora.fecha, hora.entrada, hora.salida);
      const empleado = empleados.find((item) => item.id === hora.empleadoId);
      const total = horas * Number(empleado?.pagoHora || 0);
      const data = {
        ...hora,
        horas,
        pagado: Boolean(hora.pagado),
        pagoMontoMxn: Boolean(hora.pagado) ? total : 0,
        pagoOrigen: Boolean(hora.pagado) ? 'fondoCaja' : '',
        sucursalId: user.sucursalId,
        usuarioId: user.uid,
      };

      if (editingId) {
        await actualizarHorario(editingId, data);
      } else {
        await agregarHorario(data);
      }

      cerrarDialogos();
    } catch (err) {
      console.error('Error al guardar horario:', err);
      setError(err?.message || 'No se pudo guardar el horario.');
    } finally {
      setSavingKey('');
    }
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
              Editar tiempo manual
            </Button>
          </Stack>
        )}
      </Stack>

      {!canManagePayroll && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Solo administradores, superadministradores y gerentes pueden modificar las tarjetas de tiempo.
        </Alert>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {canManagePayroll && (
        <Box mb={2.5}>
          <Typography variant="h6" mb={1}>
            Registro de hoy
          </Typography>

          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr',
                md: 'repeat(2, minmax(0, 1fr))',
                xl: 'repeat(3, minmax(0, 1fr))',
              },
              gap: 1.5,
            }}
          >
            {filasHoy.map((fila) => {
              const tieneEntrada = Boolean(fila.horario?.entrada);
              const tieneSalida = Boolean(fila.horario?.salida);
              const estaPagado = Boolean(fila.horario?.pagado);

              return (
                <Card key={fila.key} sx={{ borderRadius: 2 }}>
                  <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                    <Stack spacing={1.5}>
                      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1.5}>
                        <Box sx={{ minWidth: 0 }}>
                          <Typography fontWeight={800} sx={{ overflowWrap: 'anywhere' }}>
                            {fila.empleado.nombre}
                          </Typography>
                          <Typography color="text.secondary" fontSize={13}>
                            {fila.empleado.puesto || 'Sin puesto'}
                          </Typography>
                        </Box>
                        <Chip
                          size="small"
                          label={fila.estadoPago === 'pagado' ? 'Pagado' : fila.estadoPago === 'pendiente' ? 'Pendiente' : 'Sin tiempo'}
                          color={fila.estadoPago === 'pagado' ? 'success' : fila.estadoPago === 'pendiente' ? 'warning' : 'default'}
                          variant={fila.estadoPago === 'pagado' ? 'filled' : 'outlined'}
                        />
                      </Stack>

                      <Box
                        sx={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
                          gap: 1,
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
                          <Typography color="text.secondary" fontSize={12}>Pago</Typography>
                          <Typography fontWeight={700}>{fila.total ? formatMoney(fila.total) : '-'}</Typography>
                        </Box>
                      </Box>

                      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                        <Button
                          fullWidth
                          variant={tieneEntrada ? 'outlined' : 'contained'}
                          startIcon={<LoginIcon />}
                          onClick={() => marcarEntrada(fila)}
                          disabled={tieneEntrada || Boolean(savingKey)}
                        >
                          Entrada
                        </Button>
                        <Button
                          fullWidth
                          variant={tieneSalida ? 'outlined' : 'contained'}
                          startIcon={<LogoutIcon />}
                          onClick={() => marcarSalida(fila)}
                          disabled={!tieneEntrada || tieneSalida || Boolean(savingKey)}
                        >
                          Salida
                        </Button>
                        <Button
                          fullWidth
                          variant={estaPagado ? 'outlined' : 'contained'}
                          color="success"
                          startIcon={<PaymentsIcon />}
                          onClick={() => marcarPagado(fila)}
                          disabled={!tieneSalida || estaPagado || Boolean(savingKey)}
                        >
                          Pagado
                        </Button>
                      </Stack>

                      {isAdmin && (
                        <Button
                          variant="text"
                          size="small"
                          startIcon={<EditIcon />}
                          onClick={() => abrirHorario(fila)}
                          sx={{ alignSelf: 'flex-start' }}
                        >
                          Corregir
                        </Button>
                      )}
                    </Stack>
                  </CardContent>
                </Card>
              );
            })}

            {!filasHoy.length && (
              <Card sx={{ p: 2, borderRadius: 2 }}>
                <Typography color="text.secondary">
                  Agrega empleados para usar el registro rápido.
                </Typography>
              </Card>
            )}
          </Box>
        </Box>
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
          Pagado del fondo: {formatMoney(totales.pagado)}
        </Alert>
        <Alert severity={totales.pendiente > 0 ? 'warning' : 'info'} sx={{ flex: 1 }}>
          Pendiente: {formatMoney(totales.pendiente)}
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
                  <Box sx={{ gridColumn: '1 / -1' }}>
                    <Typography color="text.secondary" fontSize={12}>Estado</Typography>
                    <Chip
                      size="small"
                      label={fila.estadoPago === 'pagado' ? 'Pagado del fondo' : fila.estadoPago === 'pendiente' ? 'Pendiente' : 'Sin tiempo'}
                      color={fila.estadoPago === 'pagado' ? 'success' : fila.estadoPago === 'pendiente' ? 'warning' : 'default'}
                      variant={fila.pagado ? 'filled' : 'outlined'}
                    />
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
                <TableCell>Estado</TableCell>
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
                  <TableCell>
                    <Chip
                      size="small"
                      label={fila.estadoPago === 'pagado' ? 'Pagado del fondo' : fila.estadoPago === 'pendiente' ? 'Pendiente' : 'Sin tiempo'}
                      color={fila.estadoPago === 'pagado' ? 'success' : fila.estadoPago === 'pendiente' ? 'warning' : 'default'}
                      variant={fila.pagado ? 'filled' : 'outlined'}
                    />
                  </TableCell>
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
                  <TableCell colSpan={isAdmin ? 10 : 9}>
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
            {savingKey === 'empleado' ? 'Guardando...' : 'Guardar'}
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
          <FormControlLabel
            control={
              <Checkbox
                checked={Boolean(hora.pagado)}
                onChange={(e) => setHora({ ...hora, pagado: e.target.checked })}
              />
            }
            label="Pagado del fondo de caja"
          />
          <Alert severity="info">
            Horas calculadas: {calcularHoras(hora.fecha, hora.entrada, hora.salida).toFixed(2)}
          </Alert>
          {error && (
            <Alert severity="error" onClose={() => setError('')}>
              {error}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button variant="text" onClick={cerrarDialogos}>
            Cancelar
          </Button>
          <Button onClick={guardarHorario} disabled={savingKey === 'horario' || !hora.empleadoId || !hora.fecha || !hora.entrada || !hora.salida}>
            {savingKey === 'horario' ? 'Guardando...' : 'Guardar tiempo'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

