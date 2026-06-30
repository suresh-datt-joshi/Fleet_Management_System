import {
  Box,
  Chip,
  Divider,
  Drawer,
  Grid,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Typography,
  Button,
  Card,
  CardMedia,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ReceiptIcon from '@mui/icons-material/Receipt';
import { format } from 'date-fns';
import { resolveReceiptUrl } from '../../../redux/api/tripsApi';
import {
  statusColors,
  statusLabels,
  formatCurrency,
  formatLocation,
  formatDistance,
  expenseCategoryLabels,
  consignmentStatusLabels,
  consignmentStatusColors,
} from '../../trips/utils/tripUtils';

const GridRow = ({ label, value, bold }) => (
  <Box display="flex" justifyContent="space-between" py={0.5}>
    <Typography variant="body2" color="text.secondary">
      {label}
    </Typography>
    <Typography variant="body2" fontWeight={bold ? 700 : 400} textAlign="right" maxWidth="60%">
      {value}
    </Typography>
  </Box>
);

const CompletedTripDetailDrawer = ({ open, onClose, trip }) => {
  if (!trip) return null;

  const expenses = trip.expenseDetails?.expenses || [];
  const summary = trip.expenseDetails?.summary;
  const consignment = trip.consignment;

  return (
    <Drawer anchor="right" open={open} onClose={onClose} PaperProps={{ sx: { width: { xs: '100%', sm: 480 } } }}>
      <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Box>
          <Typography variant="h6" fontWeight={700}>
            {trip.tripNumber}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Completed trip summary
          </Typography>
          <Box display="flex" gap={0.5} mt={1}>
            <Chip label={statusLabels[trip.status] || trip.status} size="small" color={statusColors[trip.status]} />
          </Box>
        </Box>
        <IconButton onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </Box>

      <Box sx={{ px: 2, pb: 3, overflow: 'auto' }}>
        <Typography variant="subtitle2" fontWeight={700} mb={1}>
          Trip Details
        </Typography>
        <GridRow label="Driver" value={trip.driver?.name || '—'} />
        <GridRow label="Vehicle" value={trip.vehicle ? `${trip.vehicle.vehicleNumber} — ${trip.vehicle.model}` : '—'} />
        <GridRow label="Scheduled" value={format(new Date(trip.scheduledAt), 'MMM d, yyyy HH:mm')} />
        {trip.startedAt && <GridRow label="Started" value={format(new Date(trip.startedAt), 'MMM d, yyyy HH:mm')} />}
        {trip.submittedAt && (
          <GridRow label="Submitted" value={format(new Date(trip.submittedAt), 'MMM d, yyyy HH:mm')} />
        )}
        {trip.reviewedAt && (
          <GridRow label="Reviewed / Closed" value={format(new Date(trip.reviewedAt), 'MMM d, yyyy HH:mm')} />
        )}
        {trip.completedAt && !trip.reviewedAt && (
          <GridRow label="Completed" value={format(new Date(trip.completedAt), 'MMM d, yyyy HH:mm')} />
        )}
        <GridRow label="Origin" value={formatLocation(trip.origin)} />
        <GridRow label="Destination" value={formatLocation(trip.destination)} />
        <GridRow label="Distance" value={formatDistance(trip.distance)} />
        {trip.notes && <GridRow label="Notes" value={trip.notes} />}

        {consignment && (
          <>
            <Divider sx={{ my: 2 }} />
            <Typography variant="subtitle2" fontWeight={700} mb={1}>
              Consignment
            </Typography>
            {consignment.referenceNumber && <GridRow label="Reference" value={consignment.referenceNumber} />}
            <Box display="flex" justifyContent="space-between" py={0.5}>
              <Typography variant="body2" color="text.secondary">
                Status
              </Typography>
              <Chip
                label={consignmentStatusLabels[consignment.status] || consignment.status}
                size="small"
                color={consignmentStatusColors[consignment.status] || 'default'}
              />
            </Box>
            {consignment.description && <GridRow label="Description" value={consignment.description} />}
            {consignment.notes && <GridRow label="Notes" value={consignment.notes} />}
          </>
        )}

        <Divider sx={{ my: 2 }} />
        <Typography variant="subtitle2" fontWeight={700} mb={1}>
          Expense Summary
        </Typography>
        <GridRow label="Total Expenses" value={formatCurrency(summary?.total || trip.expenses)} bold />
        {trip.revenue > 0 && <GridRow label="Revenue" value={formatCurrency(trip.revenue)} bold />}
        {trip.revenue > 0 && (
          <GridRow label="Profit" value={formatCurrency(trip.profit ?? trip.revenue - trip.expenses)} bold />
        )}
        {trip.reviewNotes && <GridRow label="Dispatcher Remarks" value={trip.reviewNotes} />}
        {summary?.byCategory &&
          Object.entries(summary.byCategory)
            .filter(([, amount]) => amount > 0)
            .map(([cat, amount]) => (
              <GridRow key={cat} label={expenseCategoryLabels[cat] || cat} value={formatCurrency(amount)} />
            ))}

        <Divider sx={{ my: 2 }} />
        <Typography variant="subtitle2" fontWeight={700} mb={1}>
          Expense Details & Bills
        </Typography>
        {expenses.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            No expenses recorded for this trip.
          </Typography>
        ) : (
          <List dense disablePadding>
            {expenses.map((exp) => (
              <ListItem key={exp.id} sx={{ px: 0, flexDirection: 'column', alignItems: 'stretch', mb: 2 }}>
                <Box display="flex" justifyContent="space-between" alignItems="center" width="100%">
                  <Box>
                    <Typography variant="body2" fontWeight={600}>
                      {formatCurrency(exp.amount)} — {expenseCategoryLabels[exp.category]}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {exp.vendor || exp.description || '—'} · {format(new Date(exp.loggedAt), 'MMM d, HH:mm')}
                      {exp.fuelQuantity ? ` · ${exp.fuelQuantity}L` : ''}
                    </Typography>
                  </Box>
                  {exp.receiptUrl && (
                    <Button
                      size="small"
                      startIcon={<ReceiptIcon />}
                      onClick={() => window.open(resolveReceiptUrl(exp.receiptUrl), '_blank')}
                    >
                      Bill
                    </Button>
                  )}
                </Box>
                {exp.receiptUrl && exp.receiptMimeType?.startsWith('image/') && (
                  <Card sx={{ mt: 1 }}>
                    <CardMedia
                      component="img"
                      image={resolveReceiptUrl(exp.receiptUrl)}
                      alt={exp.receiptFileName || 'Receipt'}
                      sx={{ maxHeight: 160, objectFit: 'contain', bgcolor: 'grey.100' }}
                    />
                  </Card>
                )}
              </ListItem>
            ))}
          </List>
        )}
      </Box>
    </Drawer>
  );
};

export default CompletedTripDetailDrawer;
