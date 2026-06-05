import { useEffect, useState } from 'react';
import {
  Card,
  CardContent,
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
import { listenClientes } from '../../services/clientes/clientesService.js';

export default function Clientes() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [clientes, setClientes] = useState([]);

  useEffect(() => listenClientes(setClientes), []);

  return (
    <>
      <Typography variant="h5" mb={2}>
        Clientes
      </Typography>

      {isMobile ? (
        <Stack spacing={1.5}>
          {clientes.map((c) => (
            <Card key={c.id} sx={{ borderRadius: 2 }}>
              <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                <Typography fontWeight={800} sx={{ overflowWrap: 'anywhere' }}>
                  {c.nombre || 'Sin nombre'}
                </Typography>
                <Typography color="text.secondary" fontSize={13}>
                  {c.telefono || 'Sin teléfono'}
                </Typography>
                {c.notas && (
                  <Typography sx={{ mt: 1, overflowWrap: 'anywhere' }}>
                    {c.notas}
                  </Typography>
                )}
              </CardContent>
            </Card>
          ))}

          {!clientes.length && (
            <Card sx={{ p: 2, borderRadius: 2 }}>
              <Typography color="text.secondary">No hay clientes registrados.</Typography>
            </Card>
          )}
        </Stack>
      ) : (
        <ResponsiveTable minWidth={640}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Nombre</TableCell>
                <TableCell>Teléfono</TableCell>
                <TableCell>Notas</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {clientes.map((c) => (
                <TableRow key={c.id}>
                  <TableCell>{c.nombre}</TableCell>
                  <TableCell>{c.telefono}</TableCell>
                  <TableCell>{c.notas}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ResponsiveTable>
      )}
    </>
  );
}

