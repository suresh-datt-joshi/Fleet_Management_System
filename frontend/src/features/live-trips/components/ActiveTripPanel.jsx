import { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  Grid,
  List,
  ListItem,
  ListItemText,
  TextField,
  MenuItem,
  Typography,
  CircularProgress,
  IconButton,
  Tooltip,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ReceiptIcon from '@mui/icons-material/Receipt';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
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
} from '../../trips/utils/tripUtils';
import ExpenseFormDialog from './ExpenseFormDialog';
import { useGetTripMetaFuelStationsQuery } from '../../../redux/api/tripsApi';

const ActiveTripPanel = ({ trip, scheduledTrips = [], onStartTrip, startingTrip, onTripCompleted }) => {
  const { enqueueSnackbar } = useSnackbar();
  const [expenseOpen, setExpenseOpen] = useState(false);
  const [consignment, setConsignment] = useState({
    referenceNumber: '',
    description: '',
    status: CONSIGNMENT_STATUS.PENDING,
    notes: '',
  });

  useEffect(() => {
    if (trip?.consignment) {
      setConsignment({
        referenceNumber: trip.consignment.referenceNumber || '',
        description: trip.consignment.description || '',
        status: trip.consignment.status || CONSIGNMENT_STATUS.PENDING,
        notes: trip.consignment.notes || '',
      });
    }
  }, [trip?.id, trip?.consignment]);

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
      await updateConsignment({ tripId: trip.id, ...consignment }).unwrap();
      enqueueSnackbar('Consignment status updated', { variant: 'success' });
    } catch (err) {
      enqueueSnackbar(err?.data?.message || 'Update failed', { variant: 'error' });
    }
  };

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

      <Card>
        <CardContent>
          <Typography variant="subtitle1" fontWeight={700} gutterBottom>
            Consignment Status
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Reference Number"
                size="small"
                fullWidth
                value={consignment.referenceNumber}
                onChange={(e) => setConsignment((c) => ({ ...c, referenceNumber: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                select
                label="Status"
                size="small"
                fullWidth
                value={consignment.status}
                onChange={(e) => setConsignment((c) => ({ ...c, status: e.target.value }))}
              >
                {Object.values(CONSIGNMENT_STATUS).map((s) => (
                  <MenuItem key={s} value={s}>
                    {consignmentStatusLabels[s]}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Consignment Description"
                size="small"
                fullWidth
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
                value={consignment.notes}
                onChange={(e) => setConsignment((c) => ({ ...c, notes: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12}>
              <Button variant="outlined" onClick={handleConsignmentSave} disabled={updatingConsignment}>
                {updatingConsignment ? <CircularProgress size={20} /> : 'Update Consignment'}
              </Button>
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
