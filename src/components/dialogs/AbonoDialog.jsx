import { useEffect, useState } from 'react';
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, MenuItem, TextField, useMediaQuery, useTheme } from '@mui/material';
import { listenApartadosCliente } from '../../services/apartados/apartadosService.js';

export default function AbonoDialog({ open, onClose, clientes, onSave }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [clienteId, setClienteId] = useState('');
  const [apartados, setApartados] = useState([]);
  const [apartadoId, setApartadoId] = useState('');
  const [cantidad, setCantidad] = useState('');
  useEffect(() => { if (!clienteId) return; return listenApartadosCliente(clienteId, setApartados); }, [clienteId]);
  const save = async () => { await onSave({ clienteId, apartadoId, cantidad:Number(cantidad) }); setClienteId(''); setApartadoId(''); setCantidad(''); onClose(); };
  return <Dialog open={open} onClose={onClose} fullScreen={isMobile} fullWidth maxWidth="sm"><DialogTitle>Agregar abono</DialogTitle>
    <DialogContent sx={{ display:'grid', gap:2, pt:1 }}>
      <TextField select label="Cliente" value={clienteId} onChange={e=>setClienteId(e.target.value)}>{clientes.map(c => <MenuItem key={c.id} value={c.id}>{c.nombre}</MenuItem>)}</TextField>
      <TextField select label="Apartado" value={apartadoId} onChange={e=>setApartadoId(e.target.value)} disabled={!clienteId}>{apartados.map(a => <MenuItem key={a.id} value={a.id}>{a.descripcion} - saldo ${a.saldo}</MenuItem>)}</TextField>
      <TextField label="Cantidad a abonar" type="number" value={cantidad} onChange={e=>setCantidad(e.target.value)} />
    </DialogContent><DialogActions><Button variant="text" onClick={onClose}>Cancelar</Button><Button onClick={save} disabled={!apartadoId || !cantidad}>Registrar abono</Button></DialogActions></Dialog>;
}
