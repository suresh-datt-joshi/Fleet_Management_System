import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  MenuItem,
  List,
  ListItem,
  ListItemText,
  CircularProgress,
  TextField,
} from '@mui/material';
import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';

const AssignDriverDialog = ({ open, onClose, onAssign, drivers = [], isLoading, currentDriverId }) => {
  const { control, handleSubmit, reset } = useForm({
    defaultValues: { driverId: currentDriverId || '' },
  });
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (data) => {
    setSubmitting(true);
    await onAssign(data.driverId);
    setSubmitting(false);
    reset();
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Assign Driver</DialogTitle>
      <Box component="form" onSubmit={handleSubmit(onSubmit)}>
        <DialogContent>
          <Controller
            name="driverId"
            control={control}
            rules={{ required: 'Select a driver' }}
            render={({ field, fieldState: { error } }) => (
              <TextField
                {...field}
                select
                fullWidth
                label="Select Driver"
                error={!!error}
                helperText={error?.message}
                margin="normal"
              >
                {drivers.map((d) => (
                  <MenuItem key={d._id} value={d._id}>
                    {d.firstName} {d.lastName}
                    {d.employeeId ? ` (${d.employeeId})` : ''}
                    {d.assignedVehicle ? ' — currently assigned' : ''}
                  </MenuItem>
                ))}
              </TextField>
            )}
          />
          {drivers.length === 0 && (
            <List dense>
              <ListItem>
                <ListItemText primary="No drivers available" secondary="Add drivers in Driver Management module" />
              </ListItem>
            </List>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="contained" disabled={isLoading || submitting || drivers.length === 0}>
            {submitting ? <CircularProgress size={22} /> : 'Assign'}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
};

export default AssignDriverDialog;
