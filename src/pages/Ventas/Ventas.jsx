import { useEffect, useMemo, useState } from 'react';
import { Box, Button, Card, CardContent, Fab, Menu, MenuItem, Stack, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import VentaDialog from '../../components/dialogs/VentaDialog.jsx';
import ApartadoDialog from '../../components/dialogs/ApartadoDialog.jsx';
import AbonoDialog from '../../components/dialogs/AbonoDialog.jsx';
import ResponsiveTable from '../../components/ResponsiveTable.jsx';
import useMediaQuery from '@mui/material/useMediaQuery';
import { agregarVenta, listenVentasDelDia } from '../../services/ventas/ventasService.js';
import { agregarCliente, listenClientes } from '../../services/clientes/clientesService.js';
import { crearApartado, registrarAbono } from '../../services/apartados/apartadosService.js';
import { formatMoney, nowTime, todayKey } from '../../utils/date.js';
import { useUser } from '../../contexts/UserContext.jsx';
import { useNavigate } from 'react-router-dom';

export default function Ventas() {
  const isMobile = useMediaQuery('(max-width:768px)');
  const navigate = useNavigate();
  const [fecha, setFecha] = useState(todayKey());
  const { user, isSuperUser } = useUser();
  const [ventas, setVentas] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [anchor, setAnchor] = useState(null);
  const [dialog, setDialog] = useState(null);
  useEffect(() => listenVentasDelDia(fecha, setVentas), [fecha]);
  useEffect(() => listenClientes(setClientes), []);
  const total = useMemo(() => ventas.reduce((s, v) => s + Number(v.monto || 0), 0), [ventas]);

  const base = { fecha, hora: nowTime(), usuarioId: user.uid, sucursalId: user.sucursalId };

const saveVenta = (data) =>
  agregarVenta({
    ...base,
    tipo: 'venta',
    descripcion: data.descripcion,
    categoria: data.categorias.join(', '),
    categorias: data.categorias,
    monto: data.monto,
    metodoPago: data.metodoPago || 'efectivo',
    recibidoMxn: Number(data.recibidoMxn || 0),
    recibidoUsd: Number(data.recibidoUsd || 0),
    tipoCambio: Number(data.tipoCambio || 0),
    equivalenteMxn: Number(data.equivalenteMxn || 0),
    totalRecibidoMxn: Number(data.totalRecibidoMxn || 0),
    cambioMxn: Number(data.cambioMxn || 0),
    importes: data.importes || [],
  });
  const saveAbono = async (data) => { await registrarAbono({ ...data, ...base }); await agregarVenta({ ...base, tipo:'abono', descripcion:'Abono a apartado', categoria:'Apartado', monto:data.cantidad, metodoPago:data.metodoPago || 'efectivo', recibidoUsd:Number(data.recibidoUsd || 0), tipoCambio:Number(data.tipoCambio || 0), equivalenteMxn:Number(data.equivalenteMxn || 0), apartadoId:data.apartadoId, clienteId:data.clienteId }); };
  const saveApartado = async (form) => {
    let clienteId = form.clienteId;
    if (!clienteId && form.nombreCliente) {
      const doc = await agregarCliente({ nombre: form.nombreCliente, telefono: form.telefono, sucursalId: user.sucursalId });
      clienteId = doc.id;
    }
    const total = Number(form.total); const abonado = Number(form.abonoInicial || 0);
    const ap = await crearApartado({ clienteId, descripcion:form.descripcion, total, abonado, saldo: total-abonado, fechaLimite:form.fechaLimite, sucursalId:user.sucursalId, usuarioId:user.uid });
    await agregarVenta({ ...base, tipo:'apartado', descripcion:form.descripcion, categoria:'Apartado', monto:abonado, metodoPago:form.metodoPago || 'efectivo', recibidoUsd:Number(form.recibidoUsd || 0), tipoCambio:Number(form.tipoCambio || 0), equivalenteMxn:Number(form.recibidoUsd || 0) * Number(form.tipoCambio || 0), apartadoId:ap.id, clienteId });
  };

  return (
  <Box>
    <Stack
      direction={{ xs: 'column', sm: 'row' }}
      spacing={1}
      justifyContent="space-between"
      alignItems={{ xs: 'stretch', sm: 'center' }}
      mb={2}
      >
      <Box>

      <Typography variant="h5">Ventas del Día</Typography>
      <Typography color="text.secondary">{fecha}</Typography>
      
      </Box>
      
      <Button 
        variant="contained" 
        color="success" 
        onClick={() => navigate('/cortes')}
        sx={{ alignSelf: { xs: 'flex-start', sm: 'center' } }}
        >

        Generar Corte
      </Button>
    
    </Stack>

    <Card sx={{ mb:2 }}>
      <CardContent>
        <Typography color="text.secondary">Total del día</Typography>
        <Typography variant="h4" className="money">{formatMoney(total)}</Typography>
      </CardContent>
    </Card>
{isMobile ? (
  <Stack spacing={1.5}>
    {ventas.map((v) => (
<Card
  key={v.id}
  sx={{
    p: 2,
    borderRadius: 2,
    boxShadow: 2,
  }}
>
  <Stack direction="row" justifyContent="space-between" spacing={2}>
    <Box sx={{ minWidth: 0 }}>
      <Typography fontWeight={700} noWrap>
        {v.descripcion || 'Sin descripción'}
      </Typography>

      <Typography color="text.secondary" fontSize={13}>
        {v.hora} · {v.tipo}
      </Typography>

      <Typography
        fontSize={13}
        sx={{
          mt: 0.5,
          display: 'inline-block',
          px: 1,
          py: 0.25,
          borderRadius: 2,
          bgcolor: '#eaf2ff',
          color: 'primary.main',
          fontWeight: 700,
        }}
      >
        {v.categoria || 'Sin categoría'}
      </Typography>

      {v.metodoPago && (
        <Typography color="text.secondary" fontSize={13} sx={{ mt: 0.5 }}>
          Pago: {v.metodoPago}
        </Typography>
      )}
    </Box>

    <Box sx={{ textAlign: 'right', flexShrink: 0 }}>
      <Typography fontWeight={800} fontSize={18}>
        {formatMoney(v.monto)}
      </Typography>

      {isSuperUser && (
        <Button
          size="small"
          variant="text"
          startIcon={<EditIcon />}
          sx={{ mt: 1 }}
        >
          Editar
        </Button>
      )}
    </Box>
  </Stack>
</Card>
    ))}

    {!ventas.length && (
      <Card sx={{ p: 2, borderRadius: 2 }}>
        <Typography color="text.secondary">
          Todavía no hay ventas registradas hoy.
        </Typography>
      </Card>
    )}
  </Stack>
) : (
  <ResponsiveTable minWidth={780}>
    <Table>
      <TableHead>
        <TableRow>
          <TableCell>Hora</TableCell>
          <TableCell>Tipo</TableCell>
          <TableCell>Descripción</TableCell>
          <TableCell>Categoría</TableCell>
          <TableCell>Método</TableCell>
          <TableCell align="right">Monto</TableCell>
          <TableCell></TableCell>
        </TableRow>
      </TableHead>

      <TableBody>
        {ventas.map((v) => (
          <TableRow key={v.id}>
            <TableCell>{v.hora}</TableCell>
            <TableCell>{v.tipo}</TableCell>
            <TableCell>{v.descripcion}</TableCell>
            <TableCell>{v.categoria}</TableCell>
            <TableCell>{v.metodoPago || '-'}</TableCell>
            <TableCell align="right">{formatMoney(v.monto)}</TableCell>
            <TableCell>
              {isSuperUser && (
                <Button size="small" variant="text" startIcon={<EditIcon />}>
                  Editar
                </Button>
              )}
            </TableCell>
          </TableRow>
        ))}

        {!ventas.length && (
          <TableRow>
            <TableCell colSpan={7}>
              Todavía no hay ventas registradas hoy.
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  </ResponsiveTable>
)}
    <Fab color="primary" sx={{ position:'fixed', right:{ xs:16, sm:24, md:32 }, bottom:{ xs:16, sm:24, md:32 } }} onClick={e=>setAnchor(e.currentTarget)}><AddIcon /></Fab>
    <Menu anchorEl={anchor} open={Boolean(anchor)} onClose={()=>setAnchor(null)}><MenuItem onClick={()=>{setDialog('venta');setAnchor(null)}}>Venta</MenuItem><MenuItem onClick={()=>{setDialog('abono');setAnchor(null)}}>Abono</MenuItem><MenuItem onClick={()=>{setDialog('apartado');setAnchor(null)}}>Apartado</MenuItem></Menu>
    <VentaDialog open={dialog==='venta'} onClose={()=>setDialog(null)} onSave={saveVenta} />
    <AbonoDialog open={dialog==='abono'} onClose={()=>setDialog(null)} clientes={clientes} onSave={saveAbono} />
    <ApartadoDialog open={dialog==='apartado'}  onClose={()=>setDialog(null)} clientes={clientes}  onSave={saveApartado} />
  </Box>);
}

