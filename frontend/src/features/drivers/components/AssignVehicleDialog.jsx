import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  MenuItem,
  TextField,
  CircularProgress,
} from '@mui/material';
import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';

const AssignVehicleDialog = ({ open, onClose, onAssign, vehicles = [], isLoading }) => {
  const { control, handleSubmit, reset } = useForm({ defaultValues: { vehicleId: '' } });
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (data) => {
    setSubmitting(true);
    await onAssign(data.vehicleId);
    setSubmitting(false);
    reset();
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Assign Vehicle</DialogTitle>
      <Box component="form" onSubmit={handleSubmit(onSubmit)}>
        <DialogContent>
          <Controller
            name="vehicleId"
            control={control}
            rules={{ required: 'Select a vehicle' }}
            render={({ field, fieldState: { error } }) => (
              <TextField {...field} select fullWidth label="Select Vehicle" error={!!error} helperText={error?.message} margin="normal">
                {vehicles.map((v) => (
                  <MenuItem key={v._id} value={v._id}>
                    {v.vehicleNumber} — {v.manufacturer} {v.model}
                    {v.assignedDriver ? ' (assigned)' : ''}
                  </MenuItem>
                ))}
              </TextField>
            )}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="contained" disabled={isLoading || submitting || vehicles.length === 0}>
            {submitting ? <CircularProgress size={22} /> : 'Assign'}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
};

export default AssignVehicleDialog;
