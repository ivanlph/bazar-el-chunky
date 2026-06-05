import { useEffect, useState } from 'react';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  TextField,
  Box,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { listenApartadosCliente } from '../../services/apartados/apartadosService.js';

const fieldSx = {
  width: '100%',
  '&.MuiFormControl-root': {
    display: 'block',
    height: 'auto',
    minHeight: 0,
  },
  '& .MuiInputBase-root': {
    minHeight: 56,
  },
};

export default function AbonoDialog({ open, onClose, clientes, onSave }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [clienteId, setClienteId] = useState('');
  const [apartados, setApartados] = useState([]);
  const [apartadoId, setApartadoId] = useState('');
  const [cantidad, setCantidad] = useState('');
  const [metodoPago, setMetodoPago] = useState('efectivo');
  const [recibidoUsd, setRecibidoUsd] = useState('');
  const [tipoCambio, setTipoCambio] = useState('17');

  useEffect(() => {
    if (!clienteId) return undefined;
    return listenApartadosCliente(clienteId, setApartados);
  }, [clienteId]);

  const save = async () => {
    await onSave({
      clienteId,
      apartadoId,
      cantidad: Number(cantidad),
      metodoPago,
      recibidoUsd: Number(recibidoUsd || 0),
      tipoCambio: Number(tipoCambio || 0),
      equivalenteMxn: Number(recibidoUsd || 0) * Number(tipoCambio || 0),
    });
    setClienteId('');
    setApartadoId('');
    setCantidad('');
    setMetodoPago('efectivo');
    setRecibidoUsd('');
    setTipoCambio('17');
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} fullScreen={isMobile} fullWidth maxWidth="sm">
      <DialogTitle>Agregar abono</DialogTitle>
      <DialogContent sx={{ pt: 1 }}>
        <Box sx={{ display: 'grid', gap: 2 }}>
        <TextField
          select
          label="Cliente"
          value={clienteId}
          onChange={(e) => setClienteId(e.target.value)}
          fullWidth
          sx={fieldSx}
        >
          {clientes.map((c) => (
            <MenuItem key={c.id} value={c.id}>
              {c.nombre}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          select
          label="Apartado"
          value={apartadoId}
          onChange={(e) => setApartadoId(e.target.value)}
          disabled={!clienteId}
          fullWidth
          sx={fieldSx}
        >
          {apartados.map((a) => (
            <MenuItem key={a.id} value={a.id}>
              {a.descripcion} - saldo ${a.saldo}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          label="Cantidad a abonar"
          type="number"
          value={cantidad}
          onChange={(e) => setCantidad(e.target.value)}
          fullWidth
          sx={fieldSx}
        />
        <TextField
          select
          label="Método de pago"
          value={metodoPago}
          onChange={(e) => setMetodoPago(e.target.value)}
          fullWidth
          sx={fieldSx}
        >
          <MenuItem value="efectivo">Efectivo</MenuItem>
          <MenuItem value="tarjeta">Tarjeta</MenuItem>
          <MenuItem value="transferencia">Transferencia</MenuItem>
          <MenuItem value="dolares">Dólares</MenuItem>
        </TextField>
        {metodoPago === 'dolares' && (
          <>
            <TextField
              label="Recibido USD"
              type="number"
              value={recibidoUsd}
              onChange={(e) => setRecibidoUsd(e.target.value)}
              fullWidth
              sx={fieldSx}
            />
            <TextField
              label="Tipo de cambio"
              type="number"
              value={tipoCambio}
              onChange={(e) => setTipoCambio(e.target.value)}
              fullWidth
              sx={fieldSx}
            />
          </>
        )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button variant="text" onClick={onClose}>
          Cancelar
        </Button>
        <Button onClick={save} disabled={!apartadoId || !cantidad}>
          Registrar abono
        </Button>
      </DialogActions>
    </Dialog>
  );
}
