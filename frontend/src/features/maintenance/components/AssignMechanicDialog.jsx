import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
} from '@mui/material';
import { Controller, useForm } from 'react-hook-form';
import { useEffect } from 'react';

const AssignMechanicDialog = ({ open, onClose, onSubmit, mechanics = [], record, isLoading }) => {
  const { control, handleSubmit, reset } = useForm({ defaultValues: { mechanicId: '' } });

  useEffect(() => {
    if (open) {
      reset({ mechanicId: record?.assignedMechanic?.id || '' });
    }
  }, [open, record, reset]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Assign Mechanic</DialogTitle>
      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogContent>
          <Controller
            name="mechanicId"
            control={control}
            rules={{ required: 'Select a mechanic' }}
            render={({ field, fieldState }) => (
              <TextField
                {...field}
                fullWidth
                select
                label="Mechanic"
                error={Boolean(fieldState.error)}
                helperText={fieldState.error?.message}
              >
                {mechanics.map((m) => (
                  <MenuItem key={m.id} value={m.id}>
                    {m.name}
                  </MenuItem>
                ))}
              </TextField>
            )}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="contained" disabled={isLoading}>
            Assign
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default AssignMechanicDialog;
