import type { ITreasuryTransaction } from '../../../domain/ledger-models';

import { useState, useCallback } from 'react';
import { varAlpha } from 'minimal-shared/utils';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Table from '@mui/material/Table';
import Divider from '@mui/material/Divider';
import Tooltip from '@mui/material/Tooltip';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import CardHeader from '@mui/material/CardHeader';
import Typography from '@mui/material/Typography';
import TableContainer from '@mui/material/TableContainer';
import TablePagination from '@mui/material/TablePagination';

import { fDate } from 'src/shared/utils/format-time';
import { Iconify } from 'src/shared/components/iconify';
import { fNumber } from 'src/shared/utils/format-number';
import { Scrollbar } from 'src/shared/components/scrollbar';
import { TableHeadCustom } from 'src/shared/components/table';

import { IdentityAvatar } from 'src/auth/components';

// ----------------------------------------------------------------------

type Props = {
  title?: string;
  subheader?: string;
  tableData: ITreasuryTransaction[];
  headLabel?: any[];
};

export function FinancialTransactionsTable({ title, subheader, tableData, headLabel, ...other }: Props) {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const handleChangePage = useCallback((event: unknown, newPage: number) => {
    setPage(newPage);
  }, []);

  const handleChangeRowsPerPage = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  }, []);

  const dataFiltered = tableData.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  const TABLE_HEAD = headLabel || [
    { id: 'date', label: 'Data' },
    { id: 'counterparty', label: 'Contraparte' },
    { id: 'origin_institution', label: 'Origem' },
    { id: 'destination_institution', label: 'Destino' },
    { id: 'amount', label: 'Valor' },
    { id: 'status', label: 'Status', align: 'center' },
    { id: 'insights', label: 'Análise', align: 'right' },
  ];

  return (
    <Card
      sx={{
        boxShadow: (theme) => theme.customShadows.z1,
        border: (theme) => `solid 1px ${varAlpha(theme.vars.palette.grey['500Channel'], 0.12)}`,
      }}
      {...other}
    >
      <CardHeader
        title={title}
        subheader={subheader}
        sx={{ mb: 3 }}
        titleTypographyProps={{ typography: 'h6', fontWeight: 800 }}
      />

      <TableContainer sx={{ overflow: 'unset' }}>
        <Scrollbar>
          <Table sx={{ minWidth: 960 }}>
            <TableHeadCustom headCells={TABLE_HEAD} />

            <TableBody>
              {dataFiltered.map((row) => (
                <FinancialTransactionsTableRow key={row.id} row={row} />
              ))}
            </TableBody>
          </Table>
        </Scrollbar>
      </TableContainer>

      <Divider sx={{ borderStyle: 'dashed' }} />

      <TablePagination
        component="div"
        count={tableData.length}
        page={page}
        onPageChange={handleChangePage}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        rowsPerPageOptions={[5, 10, 25]}
        labelRowsPerPage="Linhas por página:"
      />
    </Card>
  );
}

// ----------------------------------------------------------------------

type FinancialTransactionsTableRowProps = {
  row: ITreasuryTransaction;
};

function FinancialTransactionsTableRow({ row }: FinancialTransactionsTableRowProps) {
  const isOutbound = row.direction === 'outbound';
  const isAudit = row.category === 'AUDIT';

  const categoryMap: Record<string, string> = {
    Subscription: 'Assinatura',
    Recurring: 'Recorrente',
    AUDIT: 'AUDITORIA',
    Inbound: 'Recebimento',
    Outbound: 'Pagamento',
  };

  return (
    <TableRow hover>
      <TableCell sx={{ whiteSpace: 'nowrap', typography: 'body2', color: 'text.secondary' }}>
        {fDate(row.created_at, 'DD/MM/YYYY')}
      </TableCell>

      <TableCell>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <IdentityAvatar
            sx={{
              width: 36,
              height: 36,
              fontSize: 14,
              fontWeight: 800,
              bgcolor: isOutbound ? 'warning.lighter' : 'success.lighter',
              color: isOutbound ? 'warning.dark' : 'success.dark',
            }}
          >
            {row.counterparty_name?.charAt(0) || '?'}
          </IdentityAvatar>
          <Box sx={{ display: 'flex', flexDirection: 'column' }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'text.primary' }}>
              {row.counterparty_name}
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.disabled', fontWeight: 600 }}>
              {categoryMap[row.category] || row.category}
            </Typography>
          </Box>
        </Box>
      </TableCell>

      <TableCell>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Iconify
            icon={'solar:bank-bold-duotone' as any}
            width={16}
            sx={{ color: 'text.disabled' }}
          />
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            {row.origin_institution}
          </Typography>
        </Box>
      </TableCell>

      <TableCell>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Iconify
            icon={'solar:card-transfer-bold-duotone' as any}
            width={16}
            sx={{ color: 'text.disabled' }}
          />
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            {row.destination_institution}
          </Typography>
        </Box>
      </TableCell>

      <TableCell
        sx={{
          color: isAudit ? 'error.main' : isOutbound ? 'error.main' : 'success.main',
        }}
      >
        <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
          {fNumber(row.amount, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </Typography>
      </TableCell>

      <TableCell align="center">
        {row.status === 'confirmed' && (
          <Tooltip title="Confirmado" placement="top">
            <Iconify
              icon={'solar:check-circle-bold-duotone' as any}
              width={24}
              sx={{ color: 'success.main' }}
            />
          </Tooltip>
        )}
        {row.status === 'pending' && (
          <Tooltip title="Pendente" placement="top">
            <Iconify
              icon={'solar:clock-circle-bold-duotone' as any}
              width={24}
              sx={{ color: 'warning.main' }}
            />
          </Tooltip>
        )}
        {(row.status === 'failed' || row.amount === 0 || row.category === 'Falta de Pagamento') && (
          <Tooltip title="Falta de Pagamento" placement="top">
            <Iconify
              icon={'solar:close-circle-bold-duotone' as any}
              width={24}
              sx={{ color: 'error.main' }}
            />
          </Tooltip>
        )}
      </TableCell>

      <TableCell align="right">
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1.5 }}>
          {row.documents && row.documents.length > 0 && (
            <Iconify
              icon={'solar:document-bold-duotone' as any}
              sx={{ color: 'text.secondary', width: 20 }}
            />
          )}
          {row.ai_flags && row.ai_flags.length > 0 && (
            <Iconify
              icon={'solar:magic-stick-3-bold-duotone' as any}
              sx={{ color: 'info.main', width: 20 }}
            />
          )}
          {row.risk_score?.level && row.risk_score.level !== 'low' && (
            <Iconify
              icon={'solar:shield-warning-bold-duotone' as any}
              sx={{ color: 'error.main', width: 20 }}
            />
          )}
        </Box>
      </TableCell>
    </TableRow>
  );
}
