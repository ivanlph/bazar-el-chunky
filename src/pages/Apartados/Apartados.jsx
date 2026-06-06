import { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Fab,
  Menu,
  MenuItem,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import PrintIcon from '@mui/icons-material/Print';
import ResponsiveTable from '../../components/ResponsiveTable.jsx';
import ApartadoDialog from '../../components/dialogs/ApartadoDialog.jsx';
import AbonoDialog from '../../components/dialogs/AbonoDialog.jsx';
import { crearApartado, listenApartados, registrarAbono } from '../../services/apartados/apartadosService.js';
import { agregarCliente, listenClientes } from '../../services/clientes/clientesService.js';
import { agregarVenta } from '../../services/ventas/ventasService.js';
import { useUser } from '../../contexts/UserContext.jsx';
import { nowTime, todayKey } from '../../utils/date.js';
import { formatMoney } from '../../utils/money.js';
import { printApartadoNota, printVentaNota } from '../../utils/printNotes.js';

export default function Apartados() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { user } = useUser();
  const [items, setItems] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [anchor, setAnchor] = useState(null);
  const [dialog, setDialog] = useState(null);
  const [abonoInicial, setAbonoInicial] = useState(null);

  useEffect(() => listenApartados(setItems), []);
  useEffect(() => listenClientes(setClientes), []);

  const nombreCliente = (clienteId) => {
    const cliente = clientes.find((c) => c.id === clienteId);
    return cliente ? cliente.nombre : 'Sin cliente';
  };

  const base = {
    fecha: todayKey(),
    hora: nowTime(),
    usuarioId: user.uid,
    usuarioNombre: user.nombre || user.email || '',
    usuarioEmail: user.email || '',
    sucursalId: user.sucursalId,
  };

  const clientePorId = (clienteId) => clientes.find((cliente) => cliente.id === clienteId);

  const registrarVentaApartado = (data) =>
    agregarVenta({
      ...base,
      tipo: data.tipo,
      descripcion: data.descripcion,
      categoria: 'Apartado',
      categorias: ['Apartado'],
      monto: Number(data.monto || 0),
      metodoPago: data.metodoPago || 'efectivo',
      recibidoUsd: Number(data.recibidoUsd || 0),
      tipoCambio: Number(data.tipoCambio || 0),
      equivalenteMxn: Number(data.equivalenteMxn || 0),
      apartadoId: data.apartadoId,
      clienteId: data.clienteId,
      folio: data.folio,
    });

  const saveApartado = async (form) => {
    let clienteId = form.clienteId;

    if (!clienteId && form.nombreCliente) {
      const doc = await agregarCliente({
        nombre: form.nombreCliente,
        telefono: form.telefono,
        sucursalId: user.sucursalId,
      });
      clienteId = doc.id;
    }

    const clienteNota = clientePorId(clienteId) || {
      id: clienteId,
      nombre: form.nombreCliente,
      telefono: form.telefono,
    };

    const totalVenta = Number(form.total || 0);
    const abonado = Number(form.abonoInicial || 0);
    const saldo = Math.max(0, totalVenta - abonado);
    const apartado = await crearApartado({
      clienteId,
      fecha: base.fecha,
      descripcion: form.descripcion,
      total: totalVenta,
      abonado,
      saldo,
      estatus: saldo <= 0 ? 'liquidado' : 'activo',
      fechaLimite: form.fechaLimite,
      sucursalId: user.sucursalId,
      usuarioId: user.uid,
    });
    printApartadoNota(apartado, { cliente: clienteNota });

    if (abonado > 0) {
      const venta = await registrarVentaApartado({
        tipo: 'apartado',
        descripcion: form.descripcion,
        monto: abonado,
        metodoPago: form.metodoPago,
        recibidoUsd: form.recibidoUsd,
        tipoCambio: form.tipoCambio,
        equivalenteMxn: Number(form.recibidoUsd || 0) * Number(form.tipoCambio || 0),
        apartadoId: apartado.id,
        clienteId,
      });
      printVentaNota(venta, { clienteNombre: clienteNota?.nombre || 'Cliente mostrador', cajeroNombre: user.nombre || user.email || '' });
    }
  };

  const saveAbono = async (data) => {
    const apartado = items.find((item) => item.id === data.apartadoId);
    const abono = await registrarAbono({ ...data, ...base });
    const venta = await registrarVentaApartado({
      tipo: 'abono',
      descripcion: apartado?.descripcion || 'Abono a apartado',
      monto: data.cantidad,
      metodoPago: data.metodoPago,
      recibidoUsd: data.recibidoUsd,
      tipoCambio: data.tipoCambio,
      equivalenteMxn: data.equivalenteMxn,
      apartadoId: data.apartadoId,
      clienteId: data.clienteId,
      folio: abono?.folio,
    });
    printVentaNota(venta, { clienteNombre: nombreCliente(data.clienteId), cajeroNombre: user.nombre || user.email || '' });
    setAbonoInicial(null);
  };

  const openAbono = (apartado, liquidar = false) => {
    setAbonoInicial({
      clienteId: apartado.clienteId,
      apartadoId: apartado.id,
      cantidad: liquidar ? Number(apartado.saldo || 0) : '',
    });
    setDialog('abono');
  };

  return (
    <>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        justifyContent="space-between"
        alignItems={{ xs: 'stretch', sm: 'center' }}
        spacing={1}
        mb={2}
      >
        <Typography variant="h5">Apartados</Typography>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
          <Button variant="outlined" onClick={() => setDialog('abono')}>
            Registrar abono
          </Button>
          <Button variant="contained" onClick={() => setDialog('apartado')}>
            Nuevo apartado
          </Button>
        </Stack>
      </Stack>

      {isMobile ? (
        <Stack spacing={1.5}>
          {items.map((a) => (
            <Card key={a.id} sx={{ borderRadius: 2 }}>
              <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1.5}>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography fontWeight={800} sx={{ overflowWrap: 'anywhere' }}>
                      {nombreCliente(a.clienteId)}
                    </Typography>
                    <Typography color="text.secondary" fontSize={13} sx={{ overflowWrap: 'anywhere' }}>
                      {a.descripcion || 'Sin artículo'}
                    </Typography>
                  </Box>
                  <Chip size="small" label={a.estatus || 'Sin estado'} sx={{ flexShrink: 0 }} />
                </Stack>

                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                    gap: 1.25,
                    mt: 1.25,
                  }}
                >
                  <Box>
                    <Typography color="text.secondary" fontSize={12}>Total</Typography>
                    <Typography fontWeight={700}>{formatMoney(a.total)}</Typography>
                  </Box>
                  <Box>
                    <Typography color="text.secondary" fontSize={12}>Abonado</Typography>
                    <Typography fontWeight={700}>{formatMoney(a.abonado)}</Typography>
                  </Box>
                  <Box>
                    <Typography color="text.secondary" fontSize={12}>Saldo</Typography>
                    <Typography fontWeight={800}>{formatMoney(a.saldo)}</Typography>
                  </Box>
                  <Box>
                    <Typography color="text.secondary" fontSize={12}>Vence</Typography>
                    <Typography fontWeight={700}>{a.fechaLimite || '-'}</Typography>
                  </Box>
                </Box>

                {a.estatus !== 'liquidado' && Number(a.saldo || 0) > 0 && (
                  <Stack direction="row" spacing={1} mt={1.5}>
                    <Button fullWidth size="small" variant="outlined" onClick={() => openAbono(a)}>
                      Abonar
                    </Button>
                    <Button fullWidth size="small" variant="contained" color="success" onClick={() => openAbono(a, true)}>
                      Liquidar
                    </Button>
                  </Stack>
                )}
                <Button
                  fullWidth
                  size="small"
                  variant="text"
                  startIcon={<PrintIcon />}
                  onClick={() => printApartadoNota(a, { cliente: clientePorId(a.clienteId), reprint: true })}
                  sx={{ mt: 1 }}
                >
                  Reimprimir nota
                </Button>
              </CardContent>
            </Card>
          ))}

          {!items.length && (
            <Card sx={{ p: 2, borderRadius: 2 }}>
              <Typography color="text.secondary">No hay apartados registrados.</Typography>
            </Card>
          )}
        </Stack>
      ) : (
        <ResponsiveTable minWidth={860}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Cliente</TableCell>
                <TableCell>Artículo</TableCell>
                <TableCell>Total</TableCell>
                <TableCell>Abonado</TableCell>
                <TableCell>Saldo</TableCell>
                <TableCell>Vence</TableCell>
                <TableCell>Estado</TableCell>
                <TableCell align="right">Acciones</TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {items.map((a) => (
                <TableRow key={a.id}>
                  <TableCell>{nombreCliente(a.clienteId)}</TableCell>
                  <TableCell>{a.descripcion}</TableCell>
                  <TableCell>{formatMoney(a.total)}</TableCell>
                  <TableCell>{formatMoney(a.abonado)}</TableCell>
                  <TableCell>{formatMoney(a.saldo)}</TableCell>
                  <TableCell>{a.fechaLimite}</TableCell>
                  <TableCell>{a.estatus}</TableCell>
                  <TableCell align="right">
                    <Stack direction="row" justifyContent="flex-end" spacing={1}>
                      <Button
                        size="small"
                        variant="text"
                        startIcon={<PrintIcon />}
                        onClick={() => printApartadoNota(a, { cliente: clientePorId(a.clienteId), reprint: true })}
                      >
                        Reimprimir
                      </Button>
                      {a.estatus !== 'liquidado' && Number(a.saldo || 0) > 0 && (
                        <>
                        <Button size="small" variant="outlined" onClick={() => openAbono(a)}>
                          Abonar
                        </Button>
                        <Button size="small" variant="contained" color="success" onClick={() => openAbono(a, true)}>
                          Liquidar
                        </Button>
                        </>
                      )}
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ResponsiveTable>
      )}

      <Fab
        color="primary"
        sx={{
          position: 'fixed',
          right: { xs: 16, sm: 24, md: 32 },
          bottom: { xs: 16, sm: 24, md: 32 },
        }}
        onClick={(e) => setAnchor(e.currentTarget)}
      >
        <AddIcon />
      </Fab>

      <Menu anchorEl={anchor} open={Boolean(anchor)} onClose={() => setAnchor(null)}>
        <MenuItem onClick={() => { setDialog('apartado'); setAnchor(null); }}>
          Nuevo apartado
        </MenuItem>
        <MenuItem onClick={() => { setDialog('abono'); setAnchor(null); }}>
          Registrar abono
        </MenuItem>
      </Menu>

      <AbonoDialog
        open={dialog === 'abono'}
        onClose={() => { setDialog(null); setAbonoInicial(null); }}
        clientes={clientes}
        onSave={saveAbono}
        initialClienteId={abonoInicial?.clienteId}
        initialApartadoId={abonoInicial?.apartadoId}
        initialCantidad={abonoInicial?.cantidad}
      />
      <ApartadoDialog
        open={dialog === 'apartado'}
        onClose={() => setDialog(null)}
        clientes={clientes}
        onSave={saveApartado}
      />
    </>
  );
}

