import { useEffect, useState } from 'react';
import {
  Card,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { listenApartados } from '../../services/apartados/apartadosService.js';
import { listenClientes } from '../../services/clientes/clientesService.js';
import { formatMoney } from '../../utils/money.js';

export default function Apartados() {
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

      <Card>
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
      </Card>
    </>
  );
}