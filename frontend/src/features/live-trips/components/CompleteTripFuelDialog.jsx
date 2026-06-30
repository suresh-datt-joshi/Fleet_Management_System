import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControlLabel,
  Grid,
  IconButton,
  MenuItem,
  Switch,
  TextField,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import LocalGasStationIcon from '@mui/icons-material/LocalGasStation';
import { TRIP_EXPENSE_CATEGORIES } from '../../../constants';
import { FUEL_TYPES, fuelTypeLabels, estimateTripEndOdometer } from '../../fuel/utils/fuelUtils';
import { decimalInputProps, moneyInputProps } from '../../../utils/numericInputProps';

const buildEmptyEntry = (trip, overrides = {}) => ({
  quantity: '',
  pricePerUnit: '',
  stationId: '',
  fuelStation: '',
  odometer: estimateTripEndOdometer(trip),
  fuelType: trip?.vehicle?.fuelType || FUEL_TYPES.DIESEL,
  receiptNumber: '',
  isFullTank: true,
  notes: '',
  loggedAt: new Date().toISOString().slice(0, 16),
  tripExpenseId: null,
  ...overrides,
});

const CompleteTripFuelDialog = ({ open, onClose, onSubmit, isLoading, trip, stations = [] }) => {
  const fuelExpenses = useMemo(
    () => (trip?.expenseDetails?.expenses || []).filter((exp) => exp.category === TRIP_EXPENSE_CATEGORIES.FUEL),
    [trip?.expenseDetails?.expenses]
  );

  const [entries, setEntries] = useState([buildEmptyEntry(trip)]);

  useEffect(() => {
    if (!open || !trip) return;

    if (fuelExpenses.length > 0) {
      setEntries(
        fuelExpenses.map((exp) => {
          const qty = exp.fuelQuantity ?? '';
          const ppu =
            qty && exp.amount ? (Number(exp.amount) / Number(qty)).toFixed(2) : '';
          return buildEmptyEntry(trip, {
            quantity: qty,
            pricePerUnit: ppu,
            fuelStation: exp.vendor || '',
            notes: exp.description || '',
            tripExpenseId: exp.id,
            loggedAt: exp.loggedAt ? new Date(exp.loggedAt).toISOString().slice(0, 16) : buildEmptyEntry(trip).loggedAt,
          });
        })
      );
      return;
    }

    setEntries([buildEmptyEntry(trip)]);
  }, [open, trip, fuelExpenses]);

  const updateEntry = (index, field, value) => {
    setEntries((current) => current.map((entry, i) => (i === index ? { ...entry, [field]: value } : entry)));
  };

  const addEntry = () => {
    setEntries((current) => [...current, buildEmptyEntry(trip)]);
  };

  const removeEntry = (index) => {
    setEntries((current) => (current.length === 1 ? current : current.filter((_, i) => i !== index)));
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    const fuelLogs = entries.map((entry) => {
      const qty = Number(entry.quantity);
      const ppu = Number(entry.pricePerUnit);
      return {
        quantity: qty,
        cost: Math.round(qty * ppu * 100) / 100,
        pricePerUnit: ppu,
        stationId: entry.stationId || null,
        fuelStation: entry.fuelStation || '',
        odometer: Number(entry.odometer || 0),
        fuelType: entry.fuelType,
        receiptNumber: entry.receiptNumber || '',
        isFullTank: entry.isFullTank !== false,
        notes: entry.notes || '',
        loggedAt: entry.loggedAt ? new Date(entry.loggedAt).toISOString() : undefined,
        tripExpenseId: entry.tripExpenseId || null,
      };
    });

    onSubmit(fuelLogs);
  };

  const isValid = entries.every(
    (entry) => Number(entry.quantity) > 0 && entry.pricePerUnit !== '' && Number(entry.pricePerUnit) >= 0
  );

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <LocalGasStationIcon color="primary" />
          Fuel Details Before Completing Trip
        </DialogTitle>
        <DialogContent dividers>
          <Alert severity="info" sx={{ mb: 2 }}>
            Enter fuel purchase details for this trip. These records will appear in the Fuel Logs section after completion.
          </Alert>

          <Typography variant="body2" color="text.secondary" mb={2}>
            Trip {trip?.tripNumber} · {trip?.vehicle?.vehicleNumber}
          </Typography>

          {entries.map((entry, index) => {
            const calculatedCost =
              entry.quantity && entry.pricePerUnit
                ? (Number(entry.quantity) * Number(entry.pricePerUnit)).toFixed(2)
                : '—';

            return (
              <Box key={`fuel-entry-${index}`} sx={{ mb: index < entries.length - 1 ? 3 : 0 }}>
                {entries.length > 1 && (
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={1.5}>
                    <Typography variant="subtitle2" fontWeight={700}>
                      Fuel stop {index + 1}
                      {entry.tripExpenseId ? ' (from live expense)' : ''}
                    </Typography>
                    <IconButton size="small" onClick={() => removeEntry(index)} disabled={entries.length === 1}>
                      <DeleteOutlineIcon fontSize="small" />
                    </IconButton>
                  </Box>
                )}

                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      select
                      fullWidth
                      label="Fuel Station"
                      value={entry.stationId}
                      onChange={(e) => updateEntry(index, 'stationId', e.target.value)}
                    >
                      <MenuItem value="">Other / Manual</MenuItem>
                      {stations.map((station) => (
                        <MenuItem key={station.id} value={station.id}>
                          {station.name} {station.city ? `(${station.city})` : ''}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Station Name (if other)"
                      value={entry.fuelStation}
                      onChange={(e) => updateEntry(index, 'fuelStation', e.target.value)}
                      disabled={Boolean(entry.stationId)}
                    />
                  </Grid>
                  <Grid item xs={6} sm={4}>
                    <TextField
                      fullWidth
                      required
                      type="number"
                      label="Quantity (L)"
                      inputProps={moneyInputProps(0.01)}
                      value={entry.quantity}
                      onChange={(e) => updateEntry(index, 'quantity', e.target.value)}
                    />
                  </Grid>
                  <Grid item xs={6} sm={4}>
                    <TextField
                      fullWidth
                      required
                      type="number"
                      label="Price per Unit ($)"
                      inputProps={moneyInputProps()}
                      value={entry.pricePerUnit}
                      onChange={(e) => updateEntry(index, 'pricePerUnit', e.target.value)}
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField
                      fullWidth
                      label="Cost ($)"
                      value={calculatedCost === '—' ? '—' : `$${calculatedCost}`}
                      disabled
                    />
                  </Grid>
                  <Grid item xs={6} sm={4}>
                    <TextField
                      select
                      fullWidth
                      label="Fuel Type"
                      value={entry.fuelType}
                      onChange={(e) => updateEntry(index, 'fuelType', e.target.value)}
                    >
                      {Object.values(FUEL_TYPES).map((type) => (
                        <MenuItem key={type} value={type}>
                          {fuelTypeLabels[type]}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>
                  <Grid item xs={6} sm={4}>
                    <TextField
                      fullWidth
                      type="number"
                      label="Odometer (km)"
                      inputProps={decimalInputProps()}
                      value={entry.odometer}
                      onChange={(e) => updateEntry(index, 'odometer', e.target.value)}
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField
                      fullWidth
                      label="Receipt Number"
                      value={entry.receiptNumber}
                      onChange={(e) => updateEntry(index, 'receiptNumber', e.target.value)}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      type="datetime-local"
                      label="Fuel Purchase Time"
                      InputLabelProps={{ shrink: true }}
                      value={entry.loggedAt}
                      onChange={(e) => updateEntry(index, 'loggedAt', e.target.value)}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={entry.isFullTank !== false}
                          onChange={(e) => updateEntry(index, 'isFullTank', e.target.checked)}
                        />
                      }
                      label="Full tank fill-up"
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Notes"
                      multiline
                      rows={2}
                      value={entry.notes}
                      onChange={(e) => updateEntry(index, 'notes', e.target.value)}
                    />
                  </Grid>
                </Grid>

                {index < entries.length - 1 && <Divider sx={{ mt: 3 }} />}
              </Box>
            );
          })}

          <Box mt={2}>
            <Button startIcon={<AddIcon />} onClick={addEntry}>
              Add Another Fuel Stop
            </Button>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="contained" color="success" disabled={isLoading || !isValid}>
            {isLoading ? 'Completing...' : 'Save Fuel & Complete Trip'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default CompleteTripFuelDialog;
