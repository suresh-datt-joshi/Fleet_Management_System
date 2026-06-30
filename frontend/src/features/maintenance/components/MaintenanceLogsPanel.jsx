import {
  Box,
  Typography,
  TextField,
  MenuItem,
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  CircularProgress,
  Link,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import { DataGrid } from '@mui/x-data-grid';
import { format } from 'date-fns';
import { useMemo, useState } from 'react';
import { useGetMaintenanceRecordsQuery } from '../../../redux/api/maintenanceApi';
import { API_BASE_URL, USER_ROLES } from '../../../constants';
import { usePermissions } from '../../../hooks/usePermissions';
import {
  MAINTENANCE_STATUS,
  statusColors,
  formatCurrency,
  getMechanicNames,
  typeLabels,
} from '../utils/maintenanceUtils';

const getFileUrl = (url) => {
  if (!url) return null;
  if (url.startsWith('http') || url.startsWith('blob:')) return url;
  const base = API_BASE_URL.replace('/api/v1', '');
  return `${base}${url}`;
};

const MaintenanceLogsPanel = ({ onViewRecord }) => {
  const { hasRole } = usePermissions();
  const isMechanic = hasRole(USER_ROLES.MECHANIC);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [statusFilter, setStatusFilter] = useState('completed');

  const queryParams = useMemo(
    () => ({
      page: page + 1,
      limit: pageSize,
      status: statusFilter || undefined,
      sort: 'completedDate:desc',
    }),
    [page, pageSize, statusFilter]
  );

  const { data, isLoading, isFetching } = useGetMaintenanceRecordsQuery(queryParams);
  const records = data?.data?.records || [];
  const pagination = data?.data?.pagination || {};

  const columns = useMemo(
    () => [
      { field: 'workOrderNumber', headerName: 'WO #', width: 120 },
      { field: 'title', headerName: 'Issue', flex: 1, minWidth: 160 },
      {
        field: 'vehicle',
        headerName: 'Vehicle',
        width: 100,
        valueGetter: (value) => value?.vehicleNumber || '—',
      },
      {
        field: 'status',
        headerName: 'Status',
        width: 120,
        renderCell: ({ value }) => (
          <Chip label={value.replace('_', ' ')} size="small" color={statusColors[value] || 'default'} sx={{ textTransform: 'capitalize' }} />
        ),
      },
      {
        field: 'completedDate',
        headerName: 'Completed',
        width: 120,
        valueFormatter: (value) => (value ? format(new Date(value), 'MMM d, yyyy') : '—'),
      },
      {
        field: 'cost',
        headerName: 'Total',
        width: 100,
        valueFormatter: (value) => formatCurrency(value),
      },
    ],
    []
  );

  return (
    <Box>
      <Typography variant="h6" fontWeight={600} gutterBottom>
        Maintenance Logs
      </Typography>
      <Typography variant="body2" color="text.secondary" mb={2}>
        {isMechanic
          ? 'Complete service history including work performed, parts, and costs.'
          : 'Complete service history including work performed, parts, costs, and documents.'}
      </Typography>

      <Box display="flex" gap={2} mb={2} flexWrap="wrap">
        <TextField size="small" select label="Status" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} sx={{ minWidth: 140 }}>
          <MenuItem value="">All</MenuItem>
          {Object.values(MAINTENANCE_STATUS).map((s) => (
            <MenuItem key={s} value={s} sx={{ textTransform: 'capitalize' }}>
              {s.replace('_', ' ')}
            </MenuItem>
          ))}
        </TextField>
      </Box>

      <Box sx={{ height: 360, mb: 3 }}>
        <DataGrid
          rows={records}
          columns={columns}
          getRowId={(row) => row.id}
          loading={isLoading || isFetching}
          paginationMode="server"
          rowCount={pagination.total || 0}
          paginationModel={{ page, pageSize }}
          onPaginationModelChange={(model) => {
            setPage(model.page);
            setPageSize(model.pageSize);
          }}
          pageSizeOptions={[10, 25, 50]}
          onRowClick={({ row }) => onViewRecord?.(row)}
          disableRowSelectionOnClick
          sx={{ bgcolor: 'background.paper', borderRadius: 2, cursor: 'pointer' }}
        />
      </Box>

      {records.filter((r) => r.status === 'completed').slice(0, 5).map((record) => (
        <Accordion key={record.id} disableGutters sx={{ mb: 1, '&:before': { display: 'none' } }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Box display="flex" alignItems="center" gap={1} flexWrap="wrap" width="100%">
              <Typography fontWeight={600}>{record.workOrderNumber}</Typography>
              <Typography variant="body2" color="text.secondary">
                {record.vehicle?.vehicleNumber} · {record.title}
              </Typography>
              <Chip label={formatCurrency(record.cost)} size="small" sx={{ ml: 'auto' }} />
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <Box display="grid" gridTemplateColumns={{ xs: '1fr', sm: '1fr 1fr' }} gap={1} mb={2}>
              <Detail label="Service Type" value={typeLabels[record.type] || record.type} />
              <Detail label="Mechanics" value={getMechanicNames(record)} />
              <Detail label="Scheduled" value={format(new Date(record.scheduledDate), 'MMM d, yyyy')} />
              <Detail label="Completed" value={record.completedDate ? format(new Date(record.completedDate), 'MMM d, yyyy') : '—'} />
              <Detail label="Labor Hours" value={record.laborHours ?? '—'} />
              <Detail label="Labor Cost" value={formatCurrency(record.laborCost)} />
              <Detail label="Parts Cost" value={formatCurrency(record.partsCost)} />
              <Detail label="Total Cost" value={formatCurrency(record.cost)} />
            </Box>
            {record.description && (
              <Typography variant="body2" color="text.secondary" mb={1}>
                <strong>Issue:</strong> {record.description}
              </Typography>
            )}
            {record.workPerformed && (
              <Typography variant="body2" color="text.secondary" mb={1}>
                <strong>Work Performed:</strong> {record.workPerformed}
              </Typography>
            )}
            {record.parts?.length > 0 && (
              <Typography variant="body2" color="text.secondary" mb={1}>
                <strong>Parts:</strong>{' '}
                {record.parts.map((p) => `${p.name} (×${p.quantity})`).join(', ')}
              </Typography>
            )}
            {!isMechanic && record.attachments?.length > 0 && (
              <Box display="flex" gap={1} flexWrap="wrap" mt={1}>
                {record.attachments.map((doc) => (
                  <Link key={doc.id || doc.fileName} href={getFileUrl(doc.fileUrl)} target="_blank" rel="noopener noreferrer" variant="body2" display="flex" alignItems="center" gap={0.5}>
                    <AttachFileIcon fontSize="small" />
                    {doc.fileName}
                  </Link>
                ))}
              </Box>
            )}
          </AccordionDetails>
        </Accordion>
      ))}

      {isLoading && (
        <Box display="flex" justifyContent="center" py={4}>
          <CircularProgress />
        </Box>
      )}
    </Box>
  );
};

const Detail = ({ label, value }) => (
  <Box>
    <Typography variant="caption" color="text.secondary">
      {label}
    </Typography>
    <Typography variant="body2">{value}</Typography>
  </Box>
);

export default MaintenanceLogsPanel;
