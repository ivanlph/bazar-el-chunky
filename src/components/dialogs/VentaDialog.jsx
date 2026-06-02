import { useState } from 'react';
import { Button, Checkbox, Dialog, DialogActions, DialogContent, DialogTitle, FormControlLabel, FormGroup, TextField, Typography } from '@mui/material';

const categorias = ['Muebles', 'Ropa', 'Chacharas', 'Herramienta', 'Electronicos', 'Otros'];

export default function VentaDialog({ open, onClose, onSave }) {
  const [form, setForm] = useState({ descripcion: '', categorias: [], monto: '' });
  const toggleCat = (cat) => setForm(f => ({ ...f, categorias: f.categorias.includes(cat) ? f.categorias.filter(c => c !== cat) : [...f.categorias, cat] }));
  const save = async () => { await onSave({ ...form, monto: Number(form.monto) }); setForm({ descripcion: '', categorias: [], monto: '' }); onClose(); };
  return <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
    <DialogTitle>Agregar venta</DialogTitle>
    <DialogContent sx={{ display:'grid', gap:2, pt:1 }}>
      <TextField label="Descripción pequeña" value={form.descripcion} onChange={e=>setForm({...form, descripcion:e.target.value})} fullWidth />
      <Typography variant="subtitle2">Categorías</Typography>
      <FormGroup>{categorias.map(c => <FormControlLabel key={c} control={<Checkbox checked={form.categorias.includes(c)} onChange={()=>toggleCat(c)} />} label={c} />)}</FormGroup>
      <TextField label="Total de venta" type="number" value={form.monto} onChange={e=>setForm({...form, monto:e.target.value})} fullWidth />
    </DialogContent>
    <DialogActions><Button variant="text" onClick={onClose}>Cancelar</Button><Button onClick={save} disabled={!form.descripcion || !form.monto}>Entrar</Button></DialogActions>
  </Dialog>;
}
