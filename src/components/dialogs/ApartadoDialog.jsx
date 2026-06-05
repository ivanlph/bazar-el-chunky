import { useState } from 'react';
import {
  Alert,
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
import dayjs from 'dayjs';

const initialForm = {
  clienteId: '',
  nombreCliente: '',
  telefono: '',
  descripcion: '',
  total: '',
  abonoInicial: '',
  metodoPago: 'efectivo',
  recibidoUsd: '',
  tipoCambio: '17',
  fechaLimite: dayjs().add(30, 'day').format('YYYY-MM-DD'),
};

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

export default function ApartadoDialog({ open, onClose, clientes, onSave }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [nuevoCliente, setNuevoCliente] = useState(false);
  const [form, setForm] = useState(initialForm);

  const save = async () => {
    await onSave(form);
    setForm(initialForm);
    setNuevoCliente(false);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} fullScreen={isMobile} fullWidth maxWidth="sm">
      <DialogTitle>Nuevo apartado</DialogTitle>
      <DialogContent sx={{ pt: 1 }}>
        <Box sx={{ display: 'grid', gap: 2 }}>
        {!nuevoCliente ? (
          <>
            <TextField
              select
              label="Cliente"
              value={form.clienteId}
              onChange={(e) => setForm({ ...form, clienteId: e.target.value })}
              fullWidth
              sx={fieldSx}
            >
              {clientes.map((c) => (
                <MenuItem key={c.id} value={c.id}>
                  {c.nombre}
                </MenuItem>
              ))}
            </TextField>

            <Button variant="outlined" onClick={() => setNuevoCliente(true)}>
              + Agregar nuevo cliente
            </Button>
          </>
        ) : (
          <>
            <TextField
              label="Nombre del cliente"
              value={form.nombreCliente}
              onChange={(e) => setForm({ ...form, nombreCliente: e.target.value })}
              fullWidth
              sx={fieldSx}
            />
            <TextField
              label="Teléfono"
              value={form.telefono}
              onChange={(e) => setForm({ ...form, telefono: e.target.value })}
              fullWidth
              sx={fieldSx}
            />
            <Button onClick={() => setNuevoCliente(false)}>
              Seleccionar cliente existente
            </Button>
          </>
        )}

        <TextField
          label="Descripción del artículo"
          value={form.descripcion}
          onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
          fullWidth
          sx={fieldSx}
        />
        <TextField
          label="Total de venta"
          type="number"
          value={form.total}
          onChange={(e) => setForm({ ...form, total: e.target.value })}
          fullWidth
          sx={fieldSx}
        />
        <TextField
          label="Cantidad a abonar"
          type="number"
          value={form.abonoInicial}
          onChange={(e) => setForm({ ...form, abonoInicial: e.target.value })}
          fullWidth
          sx={fieldSx}
        />
        <TextField
          select
          label="Método de pago del abono"
          value={form.metodoPago}
          onChange={(e) => setForm({ ...form, metodoPago: e.target.value })}
          fullWidth
          sx={fieldSx}
        >
          <MenuItem value="efectivo">Efectivo</MenuItem>
          <MenuItem value="tarjeta">Tarjeta</MenuItem>
          <MenuItem value="transferencia">Transferencia</MenuItem>
          <MenuItem value="dolares">Dólares</MenuItem>
        </TextField>
        {form.metodoPago === 'dolares' && (
          <>
            <TextField
              label="Recibido USD"
              type="number"
              value={form.recibidoUsd}
              onChange={(e) => setForm({ ...form, recibidoUsd: e.target.value })}
              fullWidth
              sx={fieldSx}
            />
            <TextField
              label="Tipo de cambio"
              type="number"
              value={form.tipoCambio}
              onChange={(e) => setForm({ ...form, tipoCambio: e.target.value })}
              fullWidth
              sx={fieldSx}
            />
          </>
        )}
        <TextField
          label="Fecha límite de liquidación"
          type="date"
          value={form.fechaLimite}
          onChange={(e) => setForm({ ...form, fechaLimite: e.target.value })}
          InputLabelProps={{ shrink: true }}
          fullWidth
          sx={fieldSx}
        />
        <Alert severity="warning">
          Recuerda generar una hoja de apartado física para el cliente.
        </Alert>
        <Button disabled>Generar nota de apartado (pendiente)</Button>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button variant="text" onClick={onClose}>
          Cancelar
        </Button>
        <Button onClick={save}>Guardar apartado</Button>
      </DialogActions>
    </Dialog>
  );
}
