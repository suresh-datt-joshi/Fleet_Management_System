import { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  IconButton,
  List,
  ListItem,
  ListItemText,
  TextField,
  Typography,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ReceiptIcon from '@mui/icons-material/Receipt';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { format } from 'date-fns';
import { useSnackbar } from 'notistack';
import { useGetTripQuery, useReviewTripMutation, resolveReceiptUrl } from '../../../redux/api/tripsApi';
import {
  statusColors,
  statusLabels,
  formatCurrency,
  formatLocation,
  formatDistance,
  expenseCategoryLabels,
  reviewExpenseFields,
  defaultExpenseBreakdown,
  sumExpenseBreakdown,
  buildBreakdownFromDriverExpenses,
  consignmentStatusLabels,
} from '../utils/tripUtils';
import { moneyInputProps } from '../../../utils/numericInputProps';

const TripReviewDialog = ({ open, onClose, tripId, onReviewed }) => {
  const { enqueueSnackbar } = useSnackbar();
  const { data, isLoading } = useGetTripQuery(tripId, { skip: !tripId || !open });
  const [reviewTrip, { isLoading: submitting }] = useReviewTripMutation();

  const trip = data?.data?.trip;
  const expenses = trip?.expenseDetails?.expenses || [];
  const expenseSummary = trip?.expenseDetails?.summary;

  const [revenue, setRevenue] = useState('');
  const [reviewNotes, setReviewNotes] = useState('');
  const [expenseBreakdown, setExpenseBreakdown] = useState(defaultExpenseBreakdown());

  useEffect(() => {
    if (!trip || !open) return;

    setRevenue(trip.revenue ? String(trip.revenue) : '');
    setReviewNotes('');
    setExpenseBreakdown(
      trip.expenseBreakdown && sumExpenseBreakdown(trip.expenseBreakdown) > 0
        ? { ...defaultExpenseBreakdown(), ...trip.expenseBreakdown }
        : buildBreakdownFromDriverExpenses(expenseSummary?.byCategory)
    );
  }, [trip, open, expenseSummary?.byCategory]);

  const totalExpenses = useMemo(() => sumExpenseBreakdown(expenseBreakdown), [expenseBreakdown]);
  const revenueNum = parseFloat(revenue) || 0;
  const profit = Math.round((revenueNum - totalExpenses) * 100) / 100;

  const handleExpenseChange = (key, value) => {
    setExpenseBreakdown((prev) => ({ ...prev, [key]: value === '' ? 0 : parseFloat(value) || 0 }));
  };

  const handleSubmit = async () => {
    if (revenue === '' || revenueNum < 0) {
      enqueueSnackbar('Please enter a valid revenue amount', { variant: 'warning' });
      return;
    }

    try {
      await reviewTrip({
        id: tripId,
        revenue: revenueNum,
        expenseBreakdown,
        reviewNotes,
      }).unwrap();
      enqueueSnackbar('Trip reviewed and closed successfully', { variant: 'success' });
      onReviewed?.();
      onClose();
    } catch (err) {
      enqueueSnackbar(err?.data?.message || 'Failed to review trip', { variant: 'error' });
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{ sx: { borderRadius: 2 } }}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1 }}>
        <Box>
          <Typography variant="h6" fontWeight={700}>
            Review Trip
          </Typography>
          {trip && (
            <Typography variant="body2" color="text.secondary">
              {trip.tripNumber}
            </Typography>
          )}
        </Box>
        <IconButton onClick={onClose} edge="end">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        {isLoading || !trip ? (
          <Box display="flex" justifyContent="center" py={6}>
            <CircularProgress />
          </Box>
        ) : (
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" fontWeight={700} gutterBottom>
                Trip Summary
              </Typography>
              <Box sx={{ bgcolor: 'action.hover', borderRadius: 2, p: 2 }}>
                <SummaryRow label="Status">
                  <Chip
                    label={statusLabels[trip.status]}
                    size="small"
                    color={statusColors[trip.status] || 'default'}
                  />
                </SummaryRow>
                <SummaryRow label="Driver" value={trip.driver?.name || '—'} />
                <SummaryRow
                  label="Vehicle"
                  value={trip.vehicle ? `${trip.vehicle.vehicleNumber} — ${trip.vehicle.model}` : '—'}
                />
                <SummaryRow label="Route" value={`${formatLocation(trip.origin)} → ${formatLocation(trip.destination)}`} />
                <SummaryRow label="Distance" value={formatDistance(trip.distance)} />
                {trip.submittedAt && (
                  <SummaryRow
                    label="Submitted"
                    value={format(new Date(trip.submittedAt), 'MMM d, yyyy HH:mm')}
                  />
                )}
                {trip.consignment?.status && (
                  <SummaryRow label="Consignment" value={consignmentStatusLabels[trip.consignment.status]} />
                )}
                {trip.notes && <SummaryRow label="Driver Notes" value={trip.notes} />}
              </Box>

              {expenses.length > 0 && (
                <Box mt={2}>
                  <Typography variant="subtitle2" fontWeight={700} gutterBottom>
                    Driver-Logged Expenses
                  </Typography>
                  <List dense disablePadding sx={{ bgcolor: 'action.hover', borderRadius: 2, px: 1 }}>
                    {expenses.map((exp) => (
                      <ListItem
                        key={exp.id}
                        sx={{ px: 1 }}
                        secondaryAction={
                          exp.receiptUrl ? (
                            <IconButton
                              edge="end"
                              size="small"
                              onClick={() => window.open(resolveReceiptUrl(exp.receiptUrl), '_blank')}
                            >
                              <ReceiptIcon fontSize="small" />
                            </IconButton>
                          ) : null
                        }
                      >
                        <ListItemText
                          primary={`${formatCurrency(exp.amount)} — ${expenseCategoryLabels[exp.category]}`}
                          secondary={exp.vendor || exp.description || format(new Date(exp.loggedAt), 'MMM d, HH:mm')}
                        />
                      </ListItem>
                    ))}
                  </List>
                </Box>
              )}
            </Grid>

            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" fontWeight={700} gutterBottom>
                Financial Review
              </Typography>

              <TextField
                fullWidth
                label="Revenue"
                type="number"
                value={revenue}
                onChange={(e) => setRevenue(e.target.value)}
                inputProps={moneyInputProps()}
                sx={{ mb: 2 }}
                required
              />

              <Typography variant="caption" color="text.secondary" fontWeight={600} display="block" mb={1}>
                Expenses Breakdown
              </Typography>
              <Grid container spacing={1.5} mb={2}>
                {reviewExpenseFields.map(({ key, label }) => (
                  <Grid item xs={6} sm={4} key={key}>
                    <TextField
                      fullWidth
                      size="small"
                      label={label}
                      type="number"
                      value={expenseBreakdown[key] ?? 0}
                      onChange={(e) => handleExpenseChange(key, e.target.value)}
                      inputProps={moneyInputProps()}
                    />
                  </Grid>
                ))}
              </Grid>

              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  bgcolor: 'action.hover',
                  borderRadius: 2,
                  p: 2,
                  mb: 2,
                }}
              >
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Total Expenses
                  </Typography>
                  <Typography variant="h6" fontWeight={700}>
                    {formatCurrency(totalExpenses)}
                  </Typography>
                </Box>
                <Box textAlign="right">
                  <Typography variant="caption" color="text.secondary">
                    Profit (Revenue − Expenses)
                  </Typography>
                  <Typography
                    variant="h6"
                    fontWeight={700}
                    color={profit >= 0 ? 'success.main' : 'error.main'}
                  >
                    {formatCurrency(profit)}
                  </Typography>
                </Box>
              </Box>

              <TextField
                fullWidth
                label="Remarks"
                multiline
                minRows={3}
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                placeholder="Dispatcher notes, adjustments, or closure remarks..."
              />
            </Grid>
          </Grid>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} disabled={submitting}>
          Cancel
        </Button>
        <Button
          variant="contained"
          color="success"
          startIcon={submitting ? <CircularProgress size={18} color="inherit" /> : <CheckCircleIcon />}
          onClick={handleSubmit}
          disabled={submitting || isLoading || !trip}
        >
          Close Trip &amp; Save Review
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const SummaryRow = ({ label, value, children }) => (
  <Box display="flex" justifyContent="space-between" alignItems="flex-start" py={0.5} gap={2}>
    <Typography variant="body2" color="text.secondary" flexShrink={0}>
      {label}
    </Typography>
    {children || (
      <Typography variant="body2" textAlign="right">
        {value}
      </Typography>
    )}
  </Box>
);

export default TripReviewDialog;
