import { useState } from 'react';
import { 
  ToggleButton, 
  ToggleButtonGroup, 
  Alert,Button, 
  Dialog, 
  DialogActions, 
  DialogContent, 
  DialogTitle, 
  TextField, 
  Typography,
  Box, 
  useMediaQuery,
  useTheme,
} from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';
import { categoriasVenta } from '../../utils/categorias.js';

function calcularTotal(valor) {
  const texto = String(valor || '').trim();

  if (!texto) return 0;

  if (!/^[0-9+.\s]+$/.test(texto)) {
    return null;
  }

  const partes = texto
    .split('+')
    .map((p) => p.trim())
    .filter(Boolean);

  if (partes.length === 0) return null;

  const total = partes.reduce((sum, item) => {
    const numero = Number(item);

    if (!Number.isFinite(numero) || numero < 0) {
      throw new Error('Número inválido');
    }

    return sum + numero;
  }, 0);

  return Number(total.toFixed(2));
}

function calcularPago(form) {

  const total = Number(form.monto || 0);

  const metodo = form.metodoPago;

  if (metodo === 'efectivo') {
    const recibido = Number(form.recibidoMxn || 0);
    return {
      total,
      recibidoMxn: recibido,
      cambioMxn: Math.max(recibido - total, 0),
      faltaMxn: Math.max(total - recibido, 0),
    };
  }

if (metodo === 'dolares') {
  const recibidoUsd = Number(form.recibidoUsd || 0);
  const tipoCambio = Number(form.tipoCambio || 0);
  const recibidoMxn = Number(form.recibidoMxn || 0);

  const equivalenteMxn = recibidoUsd * tipoCambio;
  const totalRecibidoMxn = equivalenteMxn + recibidoMxn;

  return {
    total,
    recibidoUsd,
    tipoCambio,
    recibidoMxn,
    equivalenteMxn,
    totalRecibidoMxn,
    cambioMxn: Math.max(totalRecibidoMxn - total, 0),
    faltaMxn: Math.max(total - totalRecibidoMxn, 0),
  };
}

  return {
    total,
    recibidoMxn: total,
    cambioMxn: 0,
    faltaMxn: 0,
  };
}
export default function VentaDialog({ open, onClose, onSave }) {
const theme = useTheme();
const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
const initialForm = {
  descripcion: '',
  categorias: [],
  monto: '',
  importeActual: '',
  importes: [],
  metodoPago: 'efectivo',
  recibidoMxn: '',
  recibidoUsd: '',
  tipoCambio: '17',
};
  const [form, setForm] = useState(initialForm);
  const totalImportes = form.importes.reduce(
  (sum, item) => sum + Number(item || 0),
  0
);
const tipoCambio = Number(form.tipoCambio || 0);
const totalUsd = tipoCambio > 0 ? totalImportes / tipoCambio : 0;

const agregarImporte = () => {
  const numero = Number(form.importeActual);

  if (!Number.isFinite(numero) || numero <= 0) {
    alert('Ingresa un importe válido.');
    return;
  }

  const nuevosImportes = [...form.importes, numero];

  setForm({
    ...form,
    importes: nuevosImportes,
    importeActual: '',
    monto: nuevosImportes.reduce((sum, item) => sum + Number(item || 0), 0),
  });
};

const eliminarImporte = (index) => {
  const nuevosImportes = form.importes.filter((_, i) => i !== index);

  setForm({
    ...form,
    importes: nuevosImportes,
    monto: nuevosImportes.reduce((sum, item) => sum + Number(item || 0), 0),
  });
};
  const toggleCat = (cat) => setForm(f => ({ ...f, categorias: f.categorias.includes(cat) ? f.categorias.filter(c => c !== cat) : [...f.categorias, cat] }));
const save = async () => {
  const total = Number(form.monto || 0);
  const pago = calcularPago(form);

 if (total <= 0) {
    alert('El total de la venta no es válido.');
    return;
  }

  if (
    pago.faltaMxn > 0 &&
    form.metodoPago !== 'tarjeta' &&
    form.metodoPago !== 'transferencia'
  ) {
    alert('El pago recibido no cubre el total de la venta.');
    return;
  }

  await onSave({
    ...form,
    monto: pago.total,
    importes: form.importes,
    metodoPago: form.metodoPago,
    recibidoMxn: Number(form.recibidoMxn || 0),
    recibidoUsd: Number(form.recibidoUsd || 0),
    tipoCambio: Number(form.tipoCambio || 0),
    equivalenteMxn: Number(pago.equivalenteMxn || 0),
    totalRecibidoMxn: Number(pago.totalRecibidoMxn || pago.recibidoMxn || 0),
    cambioMxn: Number(pago.cambioMxn || 0),
    
  });

  setForm(initialForm);
  onClose();
};
  return <Dialog open={open} onClose={onClose} fullScreen={isMobile} fullWidth maxWidth="sm">
    <DialogTitle>Agregar venta</DialogTitle>
    <DialogContent sx={{ display:'grid', gap:2, pt:1 }}>
      <TextField label="Descripción pequeña" value={form.descripcion} onChange={e=>setForm({...form, descripcion:e.target.value})} fullWidth />
      <Typography variant="subtitle2">Categorías</Typography>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: 'repeat(3, minmax(0, 1fr))', sm: 'repeat(4, minmax(0, 1fr))' },
          gap: 1,
        }}
      >
        {categoriasVenta.map(({ id, label, Icon }) => {
          const selected = form.categorias.includes(id);

          return (
            <Button
              key={id}
              variant={selected ? 'contained' : 'outlined'}
              color={selected ? 'primary' : 'inherit'}
              onClick={() => toggleCat(id)}
              sx={{
                minWidth: 0,
                minHeight: 78,
                px: 0.75,
                py: 1,
                display: 'flex',
                flexDirection: 'column',
                gap: 0.5,
                lineHeight: 1.1,
                position: 'relative',
                textTransform: 'none',
                borderColor: selected ? 'primary.main' : 'divider',
                bgcolor: selected ? 'primary.main' : '#f7f9fe',
              }}
            >
              {selected && (
                <CheckIcon
                  sx={{
                    position: 'absolute',
                    top: 4,
                    right: 4,
                    fontSize: 16,
                  }}
                />
              )}
              <Icon fontSize="small" />
              <Typography
                component="span"
                fontSize={11}
                fontWeight={700}
                textAlign="center"
                sx={{ overflowWrap: 'anywhere' }}
              >
                {label}
              </Typography>
            </Button>
          );
        })}
      </Box>

<Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
  <TextField
    label="Importe"
    type="number"
    inputMode="decimal"
    value={form.importeActual}
    onChange={(e) =>
      setForm({
        ...form,
        importeActual: e.target.value,
      })
    }
    fullWidth
  />

  <Button
    variant="contained"
    onClick={agregarImporte}
    sx={{ minWidth: 56, height: 56, fontSize: 24 }}
  >
    +
  </Button>
</Box>

{form.importes.length > 0 && (
  <Box>
    <Typography variant="subtitle2" color="text.secondary">
      Importes agregados
    </Typography>

    {form.importes.map((item, index) => (
      <Box
        key={`${item}-${index}`}
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          py: 0.5,
        }}
      >
        <Typography>${Number(item).toFixed(2)} MXN</Typography>

        <Button
          size="small"
          color="error"
          onClick={() => eliminarImporte(index)}
        >
          Quitar
        </Button>
      </Box>
    ))}
  </Box>
)}

<Typography sx={{ fontWeight: 800, color: 'success.main', fontSize: 20 }}>
  Total: ${Number(totalImportes || 0).toFixed(2)} MXN
</Typography>
<Box
  sx={{
    p: 1.5,
    borderRadius: 2,
    bgcolor: '#eaf2ff',
    border: '1px solid',
    borderColor: 'primary.light',
  }}
>
  <Typography fontWeight={800} color="primary.main">
    En dólares: ${totalUsd.toFixed(2)} USD
  </Typography>
  <Typography color="text.secondary" fontSize={13}>
    Tipo de cambio: ${Number(tipoCambio || 0).toFixed(2)} MXN por USD
  </Typography>
</Box>
<TextField
  label="Tipo de cambio"
  type="number"
  value={form.tipoCambio}
  onChange={(e) =>
    setForm({
      ...form,
      tipoCambio: e.target.value,
    })
  }
  fullWidth
/>
<Typography fontWeight={700}>
  Método de pago
</Typography>

<ToggleButtonGroup
  value={form.metodoPago}
  exclusive
  onChange={(e, value) => {
    if (!value) return;
    setForm({
      ...form,
      metodoPago: value,
      recibidoMxn: '',
      recibidoUsd: '',
    });
  }}
  fullWidth
  sx={{
    flexWrap: { xs: 'wrap', sm: 'nowrap' },
    '& .MuiToggleButton-root': {
      flex: { xs: '1 1 50%', sm: '1 1 0' },
      whiteSpace: 'nowrap',
    },
  }}
>
  <ToggleButton value="efectivo">
    Efectivo
  </ToggleButton>
  <ToggleButton value="tarjeta">
    Tarjeta
  </ToggleButton>
  <ToggleButton value="transferencia">
    Transferencia
  </ToggleButton>
  <ToggleButton value="dolares">
    Dólares
  </ToggleButton>
</ToggleButtonGroup>

{form.metodoPago === 'efectivo' && (
  <>
    <TextField
      label="Recibido MXN"
      type="number"
      value={form.recibidoMxn}
      onChange={(e) =>
        setForm({
          ...form,
          recibidoMxn: e.target.value,
        })
      }
      fullWidth
    />

    <Alert severity={calcularPago(form).faltaMxn > 0 ? 'warning' : 'success'}>
      {calcularPago(form).faltaMxn > 0
        ? `Faltan $${calcularPago(form).faltaMxn.toFixed(2)} MXN`
        : `Cambio: $${calcularPago(form).cambioMxn.toFixed(2)} MXN`}
    </Alert>
  </>
)}

{form.metodoPago === 'dolares' && (
  <>
    <TextField
      label="Recibido USD"
      type="number"
      value={form.recibidoUsd}
      onChange={(e) =>
        setForm({
          ...form,
          recibidoUsd: e.target.value,
        })
      }
      fullWidth
    />

    <TextField
  label="Recibido MXN adicional"
  type="number"
  value={form.recibidoMxn}
  onChange={(e) =>
    setForm({
      ...form,
      recibidoMxn: e.target.value,
    })
  }
  fullWidth
/>

<Alert severity={calcularPago(form).faltaMxn > 0 ? 'warning' : 'success'}>
  USD equivale a $
  {Number(calcularPago(form).equivalenteMxn || 0).toFixed(2)} MXN.{' '}
  Total recibido: $
  {Number(calcularPago(form).totalRecibidoMxn || 0).toFixed(2)} MXN.{' '}
  {calcularPago(form).faltaMxn > 0
    ? `Faltan $${calcularPago(form).faltaMxn.toFixed(2)} MXN`
    : `Cambio: $${calcularPago(form).cambioMxn.toFixed(2)} MXN`}
</Alert>
  </>
)}
    </DialogContent>
    <DialogActions>
      <Button variant="text" onClick={onClose}>Cancelar</Button>
      <Button
        onClick={save}
disabled={!form.descripcion || totalImportes <= 0}
      >
        Entrar
      </Button>
      </DialogActions>
  </Dialog>;
}
