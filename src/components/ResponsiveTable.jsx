import { Card, TableContainer } from '@mui/material';

export default function ResponsiveTable({ children, minWidth = 640, sx }) {
  return (
    <Card sx={{ overflow: 'hidden', ...sx }}>
      <TableContainer
        sx={{
          width: '100%',
          overflowX: 'auto',
          '& table': { minWidth },
        }}
      >
        {children}
      </TableContainer>
    </Card>
  );
}
