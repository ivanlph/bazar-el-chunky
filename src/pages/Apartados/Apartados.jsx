import { useEffect, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Chip,
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
import ResponsiveTable from '../../components/ResponsiveTable.jsx';
import { listenApartados } from '../../services/apartados/apartadosService.js';
import { listenClientes } from '../../services/clientes/clientesService.js';
import { formatMoney } from '../../utils/money.js';

export default function Apartados() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [items, setItems] = useState([]);
  const [clientes, setClientes] = useState([]);

  useEffect(() => listenApartados(setItems), []);
  useEffect(() => listenClientes(setClientes), []);

  const nombreCliente = (clienteId) => {
    const cliente = clientes.find((c) => c.id === clienteId);
    return cliente ? cliente.nombre : 'Sin cliente';
  };

  return (
    <>
      <Typography variant="h5" mb={2}>
        Apartados
      </Typography>

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
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ResponsiveTable>
      )}
    </>
  );
}

