import { useState } from 'react';
import {
  Box,
  Button,
  Card,
  Stack,
  TextField,
  Typography,
  Alert,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext.jsx';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      await login(form.email, form.password);
      navigate('/');
    } catch {
      setError('Correo o contraseña incorrectos.');
    }
  };

  return (
    <Box
      minHeight="100vh"
      display="flex"
      alignItems="center"
      justifyContent="center"
      bgcolor="#eaf2ff"
      p={2}
    >
      <Card sx={{ width: '100%', maxWidth: 420, p: 3 }}>
        <form onSubmit={submit}>
          <Stack spacing={2}>
            <Typography variant="h5" fontWeight={700}>
              Bazar El Chunky
            </Typography>

            <Typography color="text.secondary">
              Inicia sesión para continuar
            </Typography>

            {error && <Alert severity="error">{error}</Alert>}

            <TextField
              label="Correo"
              type="email"
              value={form.email}
              onChange={(e) =>
                setForm({ ...form, email: e.target.value })
              }
              fullWidth
              required
            />

            <TextField
              label="Contraseña"
              type="password"
              value={form.password}
              onChange={(e) =>
                setForm({ ...form, password: e.target.value })
              }
              fullWidth
              required
            />

            <Button type="submit" variant="contained" size="large">
              Entrar
            </Button>
          </Stack>
        </form>
      </Card>
    </Box>
  );
}