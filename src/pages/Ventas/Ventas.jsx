import { useEffect, useMemo, useState } from 'react';
import {Dialog, Box, Button, Card, CardContent, Fab, Menu, MenuItem, Stack, Table, TableBody, TableCell, TableHead, TableRow, Typography, DialogTitle, DialogContent, DialogActions,TextField,} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import VentaDialog from '../../components/dialogs/VentaDialog.jsx';
import ApartadoDialog from '../../components/dialogs/ApartadoDialog.jsx';
import AbonoDialog from '../../components/dialogs/AbonoDialog.jsx';
import { agregarVenta, listenVentasDelDia } from '../../services/ventas/ventasService.js';
import { agregarCliente, listenClientes } from '../../services/clientes/clientesService.js';
import { crearApartado, registrarAbono } from '../../services/apartados/apartadosService.js';
import { formatMoney, nowTime, todayKey } from '../../utils/date.js';
import { useUser } from '../../contexts/UserContext.jsx';

export default function Ventas() {
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
  const saveVenta = (data) => agregarVenta({ ...base, tipo:'venta', descripcion:data.descripcion, categoria:data.categorias.join(', '), categorias:data.categorias, monto:data.monto });
  const saveAbono = async (data) => { await registrarAbono({ ...data, ...base }); await agregarVenta({ ...base, tipo:'abono', descripcion:'Abono a apartado', categoria:'Apartado', monto:data.cantidad, apartadoId:data.apartadoId, clienteId:data.clienteId }); };
  const saveApartado = async (form) => {
    let clienteId = form.clienteId;
    if (!clienteId && form.nombreCliente) {
      const doc = await agregarCliente({ nombre: form.nombreCliente, telefono: form.telefono, sucursalId: user.sucursalId });
      clienteId = doc.id;
    }
    const total = Number(form.total); const abonado = Number(form.abonoInicial || 0);
    const ap = await crearApartado({ clienteId, descripcion:form.descripcion, total, abonado, saldo: total-abonado, fechaLimite:form.fechaLimite, sucursalId:user.sucursalId, usuarioId:user.uid });
    await agregarVenta({ ...base, tipo:'apartado', descripcion:form.descripcion, categoria:'Apartado', monto:abonado, apartadoId:ap.id, clienteId });
  };

  return <Box><Stack direction="row" justifyContent="space-between" alignItems="right" mb={2}><Box><Typography variant="h5">Ventas del Día</Typography><Typography color="text.secondary">{fecha}</Typography></Box><Button variant="contained" color="success" onClick={() => setDialog('corte')}>
  Generar Corte
</Button></Stack>
    <Card sx={{ mb:2 }}><CardContent><Typography color="text.secondary">Total del día</Typography><Typography variant="h4" className="money">{formatMoney(total)}</Typography></CardContent></Card>
    <Card><Table><TableHead><TableRow><TableCell>Hora</TableCell><TableCell>Tipo</TableCell><TableCell>Descripción</TableCell><TableCell>Categoría</TableCell><TableCell align="right">Monto</TableCell><TableCell></TableCell></TableRow></TableHead><TableBody>
      {ventas.map(v => <TableRow key={v.id}><TableCell>{v.hora}</TableCell><TableCell>{v.tipo}</TableCell><TableCell>{v.descripcion}</TableCell><TableCell>{v.categoria}</TableCell><TableCell align="right">{formatMoney(v.monto)}</TableCell><TableCell>{isSuperUser && <Button size="small" variant="text" startIcon={<EditIcon />}>Editar</Button>}</TableCell></TableRow>)}
      {!ventas.length && <TableRow><TableCell colSpan={6}>Todavía no hay ventas registradas hoy.</TableCell></TableRow>}
    </TableBody></Table></Card>
    <Fab color="primary" sx={{ position:'fixed', right:32, bottom:32 }} onClick={e=>setAnchor(e.currentTarget)}><AddIcon /></Fab>
    <Menu anchorEl={anchor} open={Boolean(anchor)} onClose={()=>setAnchor(null)}><MenuItem onClick={()=>{setDialog('venta');setAnchor(null)}}>Venta</MenuItem><MenuItem onClick={()=>{setDialog('abono');setAnchor(null)}}>Abono</MenuItem><MenuItem onClick={()=>{setDialog('apartado');setAnchor(null)}}>Apartado</MenuItem></Menu>
    <VentaDialog open={dialog==='venta'} onClose={()=>setDialog(null)} onSave={saveVenta} />
    <AbonoDialog open={dialog==='abono'} onClose={()=>setDialog(null)} clientes={clientes} onSave={saveAbono} />
    <ApartadoDialog open={dialog==='apartado'}  onClose={()=>setDialog(null)} clientes={clientes}  onSave={saveApartado} />
    <Dialog open={dialog === 'corte'} onClose={() => setDialog(null)} fullWidth maxWidth="sm">
  <DialogTitle>Generar Corte del Día</DialogTitle>

  <DialogContent>
    <Stack spacing={2} sx={{ mt: 1 }}>
      <TextField label="Efectivo" type="number" fullWidth />
      <TextField label="Depósitos" type="number" fullWidth />
      <TextField label="Pagos con tarjeta" type="number" fullWidth />
      <TextField label="Fondo / cantidad en caja" type="number" fullWidth />
      <TextField label="Gastos diarios" type="number" fullWidth />
    </Stack>
  </DialogContent>

  <DialogActions>
    <Button onClick={() => setDialog(null)}>Cancelar</Button>
    <Button
      variant="contained"
      onClick={() => {
        alert('Corte generado. Después lo conectamos para guardar historial y cerrar el día.');
        setDialog(null);
      }}
    >
      Confirmar Corte
    </Button>
  </DialogActions>
</Dialog>
  </Box>;
}
