import { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Grid,
  List,
  ListItem,
  ListItemText,
  TextField,
  Typography,
  CircularProgress,
  IconButton,
  Tooltip,
  Paper,
  Stack,
  alpha,
  useTheme,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ReceiptIcon from '@mui/icons-material/Receipt';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import InventoryIcon from '@mui/icons-material/Inventory';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import SaveIcon from '@mui/icons-material/Save';
import { format } from 'date-fns';
import { useSnackbar } from 'notistack';
import { CONSIGNMENT_STATUS } from '../../../constants';
import {
  useAddTripExpenseMutation,
  useUpdateConsignmentMutation,
  useCompleteTripMutation,
  resolveReceiptUrl,
} from '../../../redux/api/tripsApi';
import {
  statusColors,
  statusLabels,
  formatCurrency,
  formatLocation,
  expenseCategoryLabels,
  consignmentStatusLabels,
  consignmentStatusColors,
  consignmentStatusOrder,
} from '../../trips/utils/tripUtils';
import ExpenseFormDialog from './ExpenseFormDialog';
import { useGetTripMetaFuelStationsQuery } from '../../../redux/api/tripsApi';

const consignmentStatusIcons = {
  [CONSIGNMENT_STATUS.PICKED_UP]: InventoryIcon,
  [CONSIGNMENT_STATUS.IN_TRANSIT]: DirectionsCarIcon,
  [CONSIGNMENT_STATUS.DELIVERED]: DoneAllIcon,
  [CONSIGNMENT_STATUS.PARTIAL]: WarningAmberIcon,
  [CONSIGNMENT_STATUS.FAILED]: ErrorOutlineIcon,
};

const ConsignmentStatusCard = ({ status, selected, onSelect, theme }) => {
  const Icon = consignmentStatusIcons[status];
  const colorKey = consignmentStatusColors[status] || 'default';
  const paletteColor =
    colorKey === 'default' ? theme.palette.text.secondary : theme.palette[colorKey]?.main || theme.palette.primary.main;

  return (
    <Paper
      component="button"
      type="button"
      onClick={() => onSelect(status)}
      elevation={0}
      sx={{
        p: 1.5,
        width: '100%',
        textAlign: 'left',
        cursor: 'pointer',
        border: 2,
        borderColor: selected ? paletteColor : 'divider',
        borderRadius: 2,
        bgcolor: selected ? alpha(paletteColor, 0.08) : 'background.paper',
        transition: 'border-color 0.2s, background-color 0.2s, transform 0.15s',
        '&:hover': {
          borderColor: paletteColor,
          bgcolor: alpha(paletteColor, 0.05),
          transform: 'translateY(-1px)',
        },
      }}
    >
      <Stack direction="row" spacing={1.25} alignItems="center">
        {Icon && (
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: 1.5,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: alpha(paletteColor, selected ? 0.18 : 0.1),
              color: paletteColor,
            }}
          >
            <Icon fontSize="small" />
          </Box>
        )}
        <Box flex={1} minWidth={0}>
          <Typography variant="body2" fontWeight={selected ? 700 : 600} noWrap>
            {consignmentStatusLabels[status]}
          </Typography>
        </Box>
        {selected && <CheckCircleIcon sx={{ color: paletteColor, fontSize: 20 }} />}
      </Stack>
    </Paper>
  );
};

const ActiveTripPanel = ({ trip, scheduledTrips = [], onStartTrip, startingTrip, onTripCompleted }) => {
  const theme = useTheme();
  const { enqueueSnackbar } = useSnackbar();
  const [expenseOpen, setExpenseOpen] = useState(false);
  const [consignment, setConsignment] = useState({
    description: '',
    status: CONSIGNMENT_STATUS.IN_TRANSIT,
    notes: '',
  });

  const consignmentSyncKey = trip?.consignment?.updatedAt
    ? new Date(trip.consignment.updatedAt).getTime()
    : 0;

  useEffect(() => {
    if (!trip?.consignment) return;
    setConsignment({
      description: trip.consignment.description || '',
      status: trip.consignment.status || CONSIGNMENT_STATUS.IN_TRANSIT,
      notes: trip.consignment.notes || '',
    });
  }, [trip?.id, consignmentSyncKey]);

  const [addExpense, { isLoading: addingExpense }] = useAddTripExpenseMutation();
  const [updateConsignment, { isLoading: updatingConsignment }] = useUpdateConsignmentMutation();
  const [completeTrip, { isLoading: completing }] = useCompleteTripMutation();
  const { data: stationsData } = useGetTripMetaFuelStationsQuery(undefined, { skip: !trip });
  const fuelStations = stationsData?.data || [];

  if (!trip) {
    return (
      <Box>
        {scheduledTrips.length > 0 ? (
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                Scheduled Trips — Start to begin live updates
              </Typography>
              <List>
                {scheduledTrips.map((t) => (
                  <ListItem
                    key={t.id}
                    secondaryAction={
                      <Button
                        variant="contained"
                        size="small"
                        startIcon={startingTrip ? <CircularProgress size={16} color="inherit" /> : <PlayArrowIcon />}
                        onClick={() => onStartTrip(t.id)}
                        disabled={startingTrip}
                      >
                        Start Trip
                      </Button>
                    }
                  >
                    <ListItemText
                      primary={t.tripNumber}
                      secondary={`${formatLocation(t.origin)} → ${formatLocation(t.destination)} · ${format(new Date(t.scheduledAt), 'MMM d, HH:mm')}`}
                    />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 6 }}>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No active trip
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Start an assigned trip to log fuel, food, bills, and consignment status.
              </Typography>
            </CardContent>
          </Card>
        )}
      </Box>
    );
  }

  const expenses = trip.expenseDetails?.expenses || [];
  const summary = trip.expenseDetails?.summary;

  const handleAddExpense = async (payload) => {
    try {
      await addExpense({ tripId: trip.id, ...payload }).unwrap();
      enqueueSnackbar('Expense logged', { variant: 'success' });
      setExpenseOpen(false);
    } catch (err) {
      enqueueSnackbar(err?.data?.message || 'Failed to log expense', { variant: 'error' });
    }
  };

  const handleConsignmentSave = async () => {
    try {
      const result = await updateConsignment({ tripId: trip.id, ...consignment }).unwrap();
      const updated = result?.data?.consignment;
      if (updated) {
        setConsignment({
          description: updated.description || '',
          status: updated.status || CONSIGNMENT_STATUS.IN_TRANSIT,
          notes: updated.notes || '',
        });
      }
      enqueueSnackbar('Consignment status updated', { variant: 'success' });
    } catch (err) {
      enqueueSnackbar(err?.data?.message || 'Update failed', { variant: 'error' });
    }
  };

  const handleCopyReference = async () => {
    const ref = trip.consignment?.referenceNumber;
    if (!ref) return;
    try {
      await navigator.clipboard.writeText(ref);
      enqueueSnackbar('Reference copied', { variant: 'info' });
    } catch {
      enqueueSnackbar('Could not copy reference', { variant: 'warning' });
    }
  };

  const referenceNumber = trip.consignment?.referenceNumber || '';
  const consignmentUpdatedAt = trip.consignment?.updatedAt;
  const hasConsignmentChanges =
    consignment.description !== (trip.consignment?.description || '') ||
    consignment.status !== (trip.consignment?.status || CONSIGNMENT_STATUS.IN_TRANSIT) ||
    consignment.notes !== (trip.consignment?.notes || '');

  const handleCompleteTrip = async () => {
    try {
      await completeTrip({ id: trip.id, notes: trip.notes }).unwrap();
      enqueueSnackbar('Trip submitted for dispatcher review', { variant: 'success' });
      onTripCompleted?.();
    } catch (err) {
      enqueueSnackbar(err?.data?.message || 'Failed to complete trip', { variant: 'error' });
    }
  };

  return (
    <Box display="flex" flexDirection="column" gap={2}>
      <Card>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="flex-start" flexWrap="wrap" gap={1}>
            <Box>
              <Typography variant="h6" fontWeight={700}>
                {trip.tripNumber}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {trip.vehicle?.vehicleNumber} — {trip.vehicle?.model}
              </Typography>
            </Box>
            <Chip label={statusLabels[trip.status]} color={statusColors[trip.status]} size="small" />
          </Box>
          <Grid container spacing={2} mt={1}>
            <Grid item xs={12} sm={6}>
              <Typography variant="caption" color="text.secondary">
                Origin
              </Typography>
              <Typography variant="body2">{formatLocation(trip.origin)}</Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="caption" color="text.secondary">
                Destination
              </Typography>
              <Typography variant="body2">{formatLocation(trip.destination)}</Typography>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Typography variant="caption" color="text.secondary">
                Started
              </Typography>
              <Typography variant="body2">
                {trip.startedAt ? format(new Date(trip.startedAt), 'MMM d, HH:mm') : '—'}
              </Typography>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Typography variant="caption" color="text.secondary">
                Total Expenses
              </Typography>
              <Typography variant="body2" fontWeight={600}>
                {formatCurrency(summary?.total || trip.expenses)}
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Card
        sx={{
          overflow: 'visible',
          border: 1,
          borderColor: alpha(theme.palette.primary.main, 0.12),
        }}
      >
        <Box
          sx={{
            px: 2.5,
            py: 2,
            bgcolor: alpha(theme.palette.primary.main, 0.04),
            borderBottom: 1,
            borderColor: 'divider',
          }}
        >
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: alpha(theme.palette.primary.main, 0.12),
                color: 'primary.main',
              }}
            >
              <LocalShippingIcon />
            </Box>
            <Box flex={1}>
              <Typography variant="subtitle1" fontWeight={700}>
                Consignment Status
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Reference is assigned automatically when the trip starts
              </Typography>
            </Box>
            {consignment.status && (
              <Chip
                label={consignmentStatusLabels[consignment.status]}
                color={consignmentStatusColors[consignment.status] || 'default'}
                size="small"
                sx={{ fontWeight: 600 }}
              />
            )}
          </Stack>
        </Box>

        <CardContent sx={{ pt: 2.5 }}>
          <Paper
            variant="outlined"
            sx={{
              p: 2,
              mb: 2.5,
              borderRadius: 2,
              bgcolor: alpha(theme.palette.info.main, 0.04),
              borderColor: alpha(theme.palette.info.main, 0.2),
            }}
          >
            <Typography variant="caption" color="text.secondary" fontWeight={600} letterSpacing={0.5}>
              REFERENCE NUMBER
            </Typography>
            <Stack direction="row" alignItems="center" spacing={1} mt={0.5}>
              <Typography variant="h6" fontWeight={700} fontFamily="monospace" sx={{ letterSpacing: 1 }}>
                {referenceNumber || '—'}
              </Typography>
              {referenceNumber && (
                <Tooltip title="Copy reference">
                  <IconButton size="small" onClick={handleCopyReference}>
                    <ContentCopyIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}
            </Stack>
          </Paper>

          <Typography variant="subtitle2" fontWeight={700} gutterBottom>
            Update delivery status
          </Typography>
          <Grid container spacing={1.5} mb={2.5}>
            {consignmentStatusOrder.map((status) => (
              <Grid item xs={6} sm={4} key={status}>
                <ConsignmentStatusCard
                  status={status}
                  selected={consignment.status === status}
                  onSelect={(nextStatus) => setConsignment((c) => ({ ...c, status: nextStatus }))}
                  theme={theme}
                />
              </Grid>
            ))}
          </Grid>

          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                label="Consignment Description"
                size="small"
                fullWidth
                placeholder="What is being transported?"
                value={consignment.description}
                onChange={(e) => setConsignment((c) => ({ ...c, description: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Notes"
                size="small"
                fullWidth
                multiline
                rows={2}
                placeholder="Delivery notes, recipient details, or issues..."
                value={consignment.notes}
                onChange={(e) => setConsignment((c) => ({ ...c, notes: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12}>
              <Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={1}>
                <Typography variant="caption" color="text.secondary">
                  {consignmentUpdatedAt
                    ? `Last updated ${format(new Date(consignmentUpdatedAt), 'MMM d, yyyy · HH:mm')}`
                    : 'Not updated yet'}
                </Typography>
                <Button
                  variant="contained"
                  startIcon={updatingConsignment ? <CircularProgress size={18} color="inherit" /> : <SaveIcon />}
                  onClick={handleConsignmentSave}
                  disabled={updatingConsignment || !hasConsignmentChanges}
                >
                  Save Consignment
                </Button>
              </Stack>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="subtitle1" fontWeight={700}>
              Live Expenses
            </Typography>
            <Button size="small" variant="contained" startIcon={<AddIcon />} onClick={() => setExpenseOpen(true)}>
              Add Expense
            </Button>
          </Box>
          {expenses.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              No expenses logged yet. Add fuel, food, or other costs with bills.
            </Typography>
          ) : (
            <List dense disablePadding>
              {expenses.map((exp) => (
                <ListItem
                  key={exp.id}
                  sx={{ px: 0 }}
                  secondaryAction={
                    exp.receiptUrl && (
                      <Tooltip title="View bill">
                        <IconButton edge="end" onClick={() => window.open(resolveReceiptUrl(exp.receiptUrl), '_blank')}>
                          <ReceiptIcon />
                        </IconButton>
                      </Tooltip>
                    )
                  }
                >
                  <ListItemText
                    primary={
                      <Box display="flex" alignItems="center" gap={1}>
                        <Typography variant="body2" fontWeight={600}>
                          {formatCurrency(exp.amount)}
                        </Typography>
                        <Chip label={expenseCategoryLabels[exp.category] || exp.category} size="small" variant="outlined" />
                      </Box>
                    }
                    secondary={`${exp.vendor || exp.description || '—'} · ${format(new Date(exp.loggedAt), 'MMM d, HH:mm')}${exp.fuelQuantity ? ` · ${exp.fuelQuantity}L` : ''}`}
                  />
                </ListItem>
              ))}
            </List>
          )}
        </CardContent>
      </Card>

      <Box display="flex" justifyContent="flex-end">
        <Button
          variant="contained"
          color="success"
          size="large"
          startIcon={completing ? <CircularProgress size={20} color="inherit" /> : <CheckCircleIcon />}
          onClick={handleCompleteTrip}
          disabled={completing}
        >
          Submit for Dispatcher Review
        </Button>
      </Box>

      <ExpenseFormDialog
        open={expenseOpen}
        onClose={() => setExpenseOpen(false)}
        onSubmit={handleAddExpense}
        isLoading={addingExpense}
        trip={trip}
        stations={fuelStations}
      />
    </Box>
  );
};

export default ActiveTripPanel;
