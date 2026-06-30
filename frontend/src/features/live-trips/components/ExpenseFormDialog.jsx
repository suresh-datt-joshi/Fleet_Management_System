import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  Box,
  Typography,
  Grid,
  Divider,
  FormControlLabel,
  Switch,
} from '@mui/material';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import { TRIP_EXPENSE_CATEGORIES } from '../../../constants';
import { expenseCategoryLabels } from '../../trips/utils/tripUtils';
import { FUEL_TYPES, fuelTypeLabels } from '../../fuel/utils/fuelUtils';
import { decimalInputProps, moneyInputProps } from '../../../utils/numericInputProps';

const ExpenseFormDialog = ({
  open,
  onClose,
  onSubmit,
  isLoading,
  defaultCategory,
  trip,
  stations = [],
}) => {
  const [category, setCategory] = useState(defaultCategory || TRIP_EXPENSE_CATEGORIES.FUEL);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [vendor, setVendor] = useState('');
  const [file, setFile] = useState(null);

  const [stationId, setStationId] = useState('');
  const [fuelStation, setFuelStation] = useState('');
  const [fuelQuantity, setFuelQuantity] = useState('');
  const [fuelType, setFuelType] = useState(FUEL_TYPES.DIESEL);
  const [odometer, setOdometer] = useState('');
  const [receiptNumber, setReceiptNumber] = useState('');
  const [loggedAt, setLoggedAt] = useState('');
  const [isFullTank, setIsFullTank] = useState(true);
  const [notes, setNotes] = useState('');

  const isFuel = category === TRIP_EXPENSE_CATEGORIES.FUEL;
  const pricePerUnit =
    fuelQuantity && amount ? (Number(amount) / Number(fuelQuantity)).toFixed(2) : '—';

  const resetForm = () => {
    setCategory(defaultCategory || TRIP_EXPENSE_CATEGORIES.FUEL);
    setAmount('');
    setDescription('');
    setVendor('');
    setFile(null);
    setStationId('');
    setFuelStation('');
    setFuelQuantity('');
    setFuelType(trip?.vehicle?.fuelType || FUEL_TYPES.DIESEL);
    setOdometer(trip?.vehicle?.odometer ?? '');
    setReceiptNumber('');
    setLoggedAt(new Date().toISOString().slice(0, 16));
    setIsFullTank(true);
    setNotes('');
  };

  useEffect(() => {
    if (!open) return;

    setCategory(defaultCategory || TRIP_EXPENSE_CATEGORIES.FUEL);
    setAmount('');
    setDescription('');
    setVendor('');
    setFile(null);
    setStationId('');
    setFuelStation('');
    setFuelQuantity('');
    setFuelType(trip?.vehicle?.fuelType || FUEL_TYPES.DIESEL);
    setOdometer(trip?.vehicle?.odometer ?? '');
    setReceiptNumber('');
    setLoggedAt(new Date().toISOString().slice(0, 16));
    setIsFullTank(true);
    setNotes('');
  }, [open, trip?.id, trip?.vehicle?.fuelType, trip?.vehicle?.odometer, defaultCategory]);

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (isFuel) {
      onSubmit({
        category,
        amount: parseFloat(amount),
        fuelQuantity: parseFloat(fuelQuantity),
        stationId: stationId || undefined,
        fuelStation: stationId ? undefined : fuelStation || undefined,
        vendor: fuelStation || undefined,
        description: notes || undefined,
        notes: notes || undefined,
        fuelType,
        odometer: odometer !== '' ? parseFloat(odometer) : undefined,
        receiptNumber: receiptNumber || undefined,
        isFullTank,
        loggedAt: loggedAt ? new Date(loggedAt).toISOString() : undefined,
        file,
      });
      return;
    }

    onSubmit({
      category,
      amount: parseFloat(amount),
      description,
      vendor,
      file,
    });
  };

  const fuelValid =
    Number(fuelQuantity) > 0 && amount !== '' && Number(amount) >= 0;
  const canSubmit = isFuel ? fuelValid : Boolean(amount);

  return (
    <Dialog open={open} onClose={handleClose} maxWidth={isFuel ? 'md' : 'sm'} fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>{isFuel ? 'Log Fuel Expense' : 'Log Expense'}</DialogTitle>
        <DialogContent dividers>
          <Box display="flex" flexDirection="column" gap={2} mt={0.5}>
            <TextField
              select
              label="Category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              required
              fullWidth
            >
              {Object.values(TRIP_EXPENSE_CATEGORIES).map((cat) => (
                <MenuItem key={cat} value={cat}>
                  {expenseCategoryLabels[cat]}
                </MenuItem>
              ))}
            </TextField>

            {isFuel ? (
              <>
                <Typography variant="body2" color="text.secondary">
                  {trip?.vehicle?.vehicleNumber
                    ? `Vehicle: ${trip.vehicle.vehicleNumber}`
                    : 'Fuel details will be saved to Fuel Logs'}
                </Typography>

                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      select
                      fullWidth
                      label="Fuel Station"
                      value={stationId}
                      onChange={(e) => setStationId(e.target.value)}
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
                      value={fuelStation}
                      onChange={(e) => setFuelStation(e.target.value)}
                      disabled={Boolean(stationId)}
                    />
                  </Grid>
                  <Grid item xs={6} sm={4}>
                    <TextField
                      fullWidth
                      required
                      type="number"
                      label="Quantity (L)"
                      inputProps={moneyInputProps(0.01)}
                      value={fuelQuantity}
                      onChange={(e) => setFuelQuantity(e.target.value)}
                    />
                  </Grid>
                  <Grid item xs={6} sm={4}>
                    <TextField
                      fullWidth
                      required
                      type="number"
                      label="Cost ($)"
                      inputProps={moneyInputProps()}
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField fullWidth label="Price per Unit" value={`$${pricePerUnit}`} disabled />
                  </Grid>
                  <Grid item xs={6} sm={4}>
                    <TextField
                      select
                      fullWidth
                      label="Fuel Type"
                      value={fuelType}
                      onChange={(e) => setFuelType(e.target.value)}
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
                      value={odometer}
                      onChange={(e) => setOdometer(e.target.value)}
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField
                      fullWidth
                      label="Receipt Number"
                      value={receiptNumber}
                      onChange={(e) => setReceiptNumber(e.target.value)}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      type="datetime-local"
                      label="Fuel Purchase Time"
                      InputLabelProps={{ shrink: true }}
                      value={loggedAt}
                      onChange={(e) => setLoggedAt(e.target.value)}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <FormControlLabel
                      control={
                        <Switch checked={isFullTank} onChange={(e) => setIsFullTank(e.target.checked)} />
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
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                    />
                  </Grid>
                </Grid>
              </>
            ) : (
              <>
                <TextField
                  label="Amount ($)"
                  type="number"
                  inputProps={moneyInputProps()}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                  fullWidth
                />
                <TextField
                  label="Vendor"
                  value={vendor}
                  onChange={(e) => setVendor(e.target.value)}
                  fullWidth
                />
                <TextField
                  label="Description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  multiline
                  rows={2}
                  fullWidth
                />
              </>
            )}

            <Divider />

            <Box>
              <Button variant="outlined" component="label" startIcon={<AttachFileIcon />} fullWidth>
                {file ? file.name : 'Upload Bill / Receipt'}
                <input
                  type="file"
                  hidden
                  accept="image/*,.pdf"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                />
              </Button>
              {file && (
                <Typography variant="caption" color="text.secondary" display="block" mt={0.5}>
                  {file.name} ({Math.round(file.size / 1024)} KB)
                </Typography>
              )}
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button type="submit" variant="contained" disabled={isLoading || !canSubmit}>
            Save Expense
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default ExpenseFormDialog;
