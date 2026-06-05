import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Divider,
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
import ResponsiveTable from '../../components/ResponsiveTable.jsx';
import { listenGastosDelDia } from '../../services/gastos/gastosService.js';
import { listenVentasDelDia } from '../../services/ventas/ventasService.js';
import {
  crearCorte,
  listenCorteDelDia,
  listenCortes,
} from '../../services/cortes/cortesService.js';
import { useUser } from '../../contexts/UserContext.jsx';
import { formatMoney, todayKey } from '../../utils/date.js';

const initialConteo = {
  efectivoMxn: '',
  dolaresUsd: '',
  tarjetaMxn: '',
  transferenciasMxn: '',
  depositosMxn: '',
  fondoCajaMxn: '',
  observaciones: '',
};

const numberValue = (value) => Number(value || 0);

function AmountRow({ label, value, labelColor = 'text.primary' }) {
  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1fr) auto',
        gap: 1,
        alignItems: 'center',
      }}
    >
      <Typography color={labelColor} sx={{ minWidth: 0 }}>
        {label}
      </Typography>
      <Typography fontWeight={700} sx={{ whiteSpace: 'nowrap' }}>
        {value}
      </Typography>
    </Box>
  );
}

function SummaryCard({ label, value, color = 'text.primary' }) {
  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Typography color="text.secondary">{label}</Typography>
        <Typography variant="h5" color={color}>
          {value}
        </Typography>
      </CardContent>
    </Card>
  );
}

function sumarVentas(ventas) {
  return ventas.reduce(
    (totals, venta) => {
      const monto = numberValue(venta.monto);
      const metodo = String(venta.metodoPago || 'efectivo').toLowerCase();

      totals.totalVentas += monto;

      if (metodo === 'tarjeta') {
        totals.tarjeta += monto;
      } else if (metodo === 'transferencia') {
        totals.transferencias += monto;
      } else if (metodo === 'dolares') {
        totals.dolaresUsd += numberValue(venta.recibidoUsd);
        totals.dolaresMxn += numberValue(venta.equivalenteMxn || monto);
        totals.efectivo += numberValue(venta.recibidoMxn);
      } else {
        totals.efectivo += monto;
      }

      return totals;
    },
    {
      totalVentas: 0,
      efectivo: 0,
      tarjeta: 0,
      transferencias: 0,
      dolaresUsd: 0,
      dolaresMxn: 0,
    }
  );
}

function CortesContent() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { user } = useUser();
  const [fecha, setFecha] = useState(todayKey());
  const [ventas, setVentas] = useState([]);
  const [gastos, setGastos] = useState([]);
  const [cortes, setCortes] = useState([]);
  const [cortesDelDia, setCortesDelDia] = useState([]);
  const [conteo, setConteo] = useState(initialConteo);
  const [saving, setSaving] = useState(false);

  useEffect(() => listenVentasDelDia(fecha, setVentas), [fecha]);
  useEffect(() => listenGastosDelDia(fecha, setGastos), [fecha]);
  useEffect(() => listenCortes(setCortes), []);
  useEffect(
    () => listenCorteDelDia(fecha, user.sucursalId, setCortesDelDia),
    [fecha, user.sucursalId]
  );

  const resumen = useMemo(() => {
    const ventasSistema = sumarVentas(ventas);
    const gastosSistema = gastos.reduce(
      (sum, gasto) => sum + numberValue(gasto.monto),
      0
    );

    const contado = {
      efectivoMxn: numberValue(conteo.efectivoMxn),
      dolaresUsd: numberValue(conteo.dolaresUsd),
      tarjetaMxn: numberValue(conteo.tarjetaMxn),
      transferenciasMxn: numberValue(conteo.transferenciasMxn),
      depositosMxn: numberValue(conteo.depositosMxn),
      fondoCajaMxn: numberValue(conteo.fondoCajaMxn),
    };

    const efectivoEsperado =
      ventasSistema.efectivo + ventasSistema.dolaresMxn - gastosSistema;
    const diferenciaEfectivo = contado.efectivoMxn - efectivoEsperado;
    const diferenciaTarjeta = contado.tarjetaMxn - ventasSistema.tarjeta;
    const diferenciaTransferencias =
      contado.transferenciasMxn +
      contado.depositosMxn -
      ventasSistema.transferencias;
    const diferenciaTotal =
      diferenciaEfectivo + diferenciaTarjeta + diferenciaTransferencias;

    return {
      ventasSistema,
      gastosSistema,
      contado,
      efectivoEsperado,
      diferenciaEfectivo,
      diferenciaTarjeta,
      diferenciaTransferencias,
      diferenciaTotal,
    };
  }, [conteo, gastos, ventas]);

  const corteExistente = cortesDelDia[0];

  const guardarCorte = async () => {
    if (corteExistente) {
      alert('Este día ya tiene un corte guardado.');
      return;
    }

    setSaving(true);

    try {
      await crearCorte({
        fecha,
        sucursalId: user.sucursalId,
        usuarioId: user.uid,
        usuarioNombre: user.nombre,
        totalVentasSistema: resumen.ventasSistema.totalVentas,
        efectivoSistemaMxn: resumen.ventasSistema.efectivo,
        dolaresSistemaUsd: resumen.ventasSistema.dolaresUsd,
        dolaresSistemaMxn: resumen.ventasSistema.dolaresMxn,
        tarjetaSistemaMxn: resumen.ventasSistema.tarjeta,
        transferenciasSistemaMxn: resumen.ventasSistema.transferencias,
        gastosSistemaMxn: resumen.gastosSistema,
        efectivoEsperadoMxn: resumen.efectivoEsperado,
        efectivoContadoMxn: resumen.contado.efectivoMxn,
        dolaresContadosUsd: resumen.contado.dolaresUsd,
        tarjetaContadaMxn: resumen.contado.tarjetaMxn,
        transferenciasContadasMxn: resumen.contado.transferenciasMxn,
        depositosContadosMxn: resumen.contado.depositosMxn,
        fondoCajaMxn: resumen.contado.fondoCajaMxn,
        diferenciaEfectivoMxn: resumen.diferenciaEfectivo,
        diferenciaTarjetaMxn: resumen.diferenciaTarjeta,
        diferenciaTransferenciasMxn: resumen.diferenciaTransferencias,
        diferenciaTotalMxn: resumen.diferenciaTotal,
        ventasCount: ventas.length,
        gastosCount: gastos.length,
        observaciones: conteo.observaciones.trim(),
      });

      setConteo(initialConteo);
    } finally {
      setSaving(false);
    }
  };

  const differenceColor =
    resumen.diferenciaTotal === 0
      ? 'text.primary'
      : resumen.diferenciaTotal > 0
        ? 'success.main'
        : 'error.main';

  return (
    <Box>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        justifyContent="space-between"
        alignItems={{ xs: 'stretch', sm: 'center' }}
        spacing={2}
        mb={2}
      >
        <Box>
          <Typography variant="h5">Corte de caja</Typography>
          <Typography color="text.secondary">
            Cierra ventas, gastos y dinero contado por día.
          </Typography>
        </Box>

        <TextField
          type="date"
          label="Fecha"
          value={fecha}
          onChange={(e) => setFecha(e.target.value)}
          InputLabelProps={{ shrink: true }}
          fullWidth={isMobile}
          sx={{ minWidth: { sm: 180 } }}
        />
      </Stack>

      {corteExistente && (
        <Alert severity="success" sx={{ mb: 2 }}>
          Este día ya está cerrado. Diferencia total:{' '}
          {formatMoney(corteExistente.diferenciaTotalMxn)}.
        </Alert>
      )}

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            sm: 'repeat(2, minmax(0, 1fr))',
            lg: 'repeat(4, minmax(0, 1fr))',
          },
          gap: 2,
          mb: 2,
        }}
      >
        <SummaryCard
          label="Ventas sistema"
          value={formatMoney(resumen.ventasSistema.totalVentas)}
        />
        <SummaryCard label="Gastos diarios" value={formatMoney(resumen.gastosSistema)} />
        <SummaryCard
          label="Efectivo esperado"
          value={formatMoney(resumen.efectivoEsperado)}
        />
        <SummaryCard
          label="Diferencia total"
          value={formatMoney(resumen.diferenciaTotal)}
          color={differenceColor}
        />
      </Box>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            md: 'minmax(0, 1fr) minmax(0, 1fr)',
          },
          gap: 2,
        }}
      >
        <Card sx={{ minWidth: 0 }}>
          <CardContent>
            <Typography variant="h6" mb={2}>
              Sistema
            </Typography>

            <Stack spacing={1}>
              <AmountRow
                label="Efectivo ventas"
                value={formatMoney(resumen.ventasSistema.efectivo)}
              />
              <AmountRow
                label="Dólares recibidos"
                value={`$${resumen.ventasSistema.dolaresUsd.toFixed(2)} USD`}
              />
              <AmountRow
                label="Dólares en MXN"
                value={formatMoney(resumen.ventasSistema.dolaresMxn)}
              />
              <AmountRow
                label="Tarjeta"
                value={formatMoney(resumen.ventasSistema.tarjeta)}
              />
              <AmountRow
                label="Transferencias"
                value={formatMoney(resumen.ventasSistema.transferencias)}
              />

              <Divider />

              <AmountRow
                label="Menos gastos diarios"
                value={formatMoney(resumen.gastosSistema)}
              />
            </Stack>
          </CardContent>
        </Card>

        <Card sx={{ minWidth: 0 }}>
          <CardContent>
            <Typography variant="h6" mb={2}>
              Dinero contado
            </Typography>

            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: {
                  xs: '1fr',
                  sm: 'repeat(2, minmax(0, 1fr))',
                },
                gap: 2,
              }}
            >
              <TextField
                label="Efectivo MXN"
                type="number"
                fullWidth
                value={conteo.efectivoMxn}
                onChange={(e) =>
                  setConteo({ ...conteo, efectivoMxn: e.target.value })
                }
              />
              <TextField
                label="Dólares USD"
                type="number"
                fullWidth
                value={conteo.dolaresUsd}
                onChange={(e) =>
                  setConteo({ ...conteo, dolaresUsd: e.target.value })
                }
              />
              <TextField
                label="Tarjeta MXN"
                type="number"
                fullWidth
                value={conteo.tarjetaMxn}
                onChange={(e) =>
                  setConteo({ ...conteo, tarjetaMxn: e.target.value })
                }
              />
              <TextField
                label="Transferencias MXN"
                type="number"
                fullWidth
                value={conteo.transferenciasMxn}
                onChange={(e) =>
                  setConteo({ ...conteo, transferenciasMxn: e.target.value })
                }
              />
              <TextField
                label="Depósitos MXN"
                type="number"
                fullWidth
                value={conteo.depositosMxn}
                onChange={(e) =>
                  setConteo({ ...conteo, depositosMxn: e.target.value })
                }
              />
              <TextField
                label="Fondo de caja MXN"
                type="number"
                fullWidth
                value={conteo.fondoCajaMxn}
                onChange={(e) =>
                  setConteo({ ...conteo, fondoCajaMxn: e.target.value })
                }
              />
              <TextField
                label="Observaciones"
                fullWidth
                multiline
                rows={3}
                value={conteo.observaciones}
                onChange={(e) =>
                  setConteo({ ...conteo, observaciones: e.target.value })
                }
                sx={{ gridColumn: '1 / -1' }}
              />
            </Box>

            <Stack direction="row" justifyContent="flex-end" mt={2}>
              <Button
                variant="contained"
                onClick={guardarCorte}
                disabled={saving || Boolean(corteExistente)}
              >
                Guardar corte
              </Button>
            </Stack>
          </CardContent>
        </Card>
      </Box>

      <Typography variant="h6" mt={3} mb={1}>
        Historial de cortes
      </Typography>

      {isMobile ? (
        <Stack spacing={1.5}>
          {cortes.map((corte) => (
            <Card key={corte.id}>
              <CardContent>
                <Stack spacing={1}>
                  <Box
                    sx={{
                      display: 'grid',
                      gridTemplateColumns: 'minmax(0, 1fr) auto',
                      gap: 2,
                      alignItems: 'start',
                    }}
                  >
                    <Box sx={{ minWidth: 0 }}>
                      <Typography fontWeight={700}>{corte.fecha}</Typography>
                      <Typography color="text.secondary" fontSize={13} noWrap>
                        {corte.usuarioNombre || corte.usuarioId}
                      </Typography>
                    </Box>
                    <Typography
                      fontWeight={800}
                      sx={{ whiteSpace: 'nowrap' }}
                      color={
                        Number(corte.diferenciaTotalMxn || 0) === 0
                          ? 'text.primary'
                          : Number(corte.diferenciaTotalMxn || 0) > 0
                            ? 'success.main'
                            : 'error.main'
                      }
                    >
                      {formatMoney(corte.diferenciaTotalMxn)}
                    </Typography>
                  </Box>

                  <Divider />

                  <AmountRow
                    label="Ventas"
                    labelColor="text.secondary"
                    value={formatMoney(corte.totalVentasSistema)}
                  />
                  <AmountRow
                    label="Gastos"
                    labelColor="text.secondary"
                    value={formatMoney(corte.gastosSistemaMxn)}
                  />
                  <AmountRow
                    label="Esperado"
                    labelColor="text.secondary"
                    value={formatMoney(corte.efectivoEsperadoMxn)}
                  />
                  <AmountRow
                    label="Contado"
                    labelColor="text.secondary"
                    value={formatMoney(corte.efectivoContadoMxn)}
                  />

                  {corte.observaciones && (
                    <Typography color="text.secondary" fontSize={13}>
                      {corte.observaciones}
                    </Typography>
                  )}
                </Stack>
              </CardContent>
            </Card>
          ))}

          {!cortes.length && (
            <Card>
              <CardContent>
                <Typography color="text.secondary">
                  Todavía no hay cortes guardados.
                </Typography>
              </CardContent>
            </Card>
          )}
        </Stack>
      ) : (
        <ResponsiveTable minWidth={920}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Fecha</TableCell>
                <TableCell>Usuario</TableCell>
                <TableCell align="right">Ventas</TableCell>
                <TableCell align="right">Gastos</TableCell>
                <TableCell align="right">Esperado</TableCell>
                <TableCell align="right">Contado</TableCell>
                <TableCell align="right">Diferencia</TableCell>
                <TableCell>Notas</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {cortes.map((corte) => (
                <TableRow key={corte.id}>
                  <TableCell>{corte.fecha}</TableCell>
                  <TableCell>{corte.usuarioNombre || corte.usuarioId}</TableCell>
                  <TableCell align="right">
                    {formatMoney(corte.totalVentasSistema)}
                  </TableCell>
                  <TableCell align="right">
                    {formatMoney(corte.gastosSistemaMxn)}
                  </TableCell>
                  <TableCell align="right">
                    {formatMoney(corte.efectivoEsperadoMxn)}
                  </TableCell>
                  <TableCell align="right">
                    {formatMoney(corte.efectivoContadoMxn)}
                  </TableCell>
                  <TableCell align="right">
                    {formatMoney(corte.diferenciaTotalMxn)}
                  </TableCell>
                  <TableCell>{corte.observaciones || '-'}</TableCell>
                </TableRow>
              ))}

              {!cortes.length && (
                <TableRow>
                  <TableCell colSpan={8}>
                    Todavía no hay cortes guardados.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </ResponsiveTable>
      )}
    </Box>
  );
}

export default function Cortes() {
  const { isAdmin } = useUser();

  if (!isAdmin) {
    return (
      <Box>
        <Typography variant="h5" mb={2}>
          Cortes
        </Typography>
        <Alert severity="warning">
          No tienes permisos para ver cortes de caja.
        </Alert>
      </Box>
    );
  }

  return <CortesContent />;
}
