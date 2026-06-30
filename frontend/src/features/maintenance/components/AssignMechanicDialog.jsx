import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  Chip,
  Box,
} from '@mui/material';
import { Controller, useForm } from 'react-hook-form';
import { useEffect } from 'react';
import { getMechanicNames } from '../utils/maintenanceUtils';

const AssignMechanicDialog = ({ open, onClose, onSubmit, mechanics = [], record, isLoading }) => {
  const { control, handleSubmit, reset } = useForm({ defaultValues: { mechanicIds: [] } });

  useEffect(() => {
    if (open) {
      const ids = record?.assignedMechanics?.length
        ? record.assignedMechanics.map((m) => m.id)
        : record?.assignedMechanic?.id
          ? [record.assignedMechanic.id]
          : [];
      reset({ mechanicIds: ids });
    }
  }, [open, record, reset]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Assign Mechanics</DialogTitle>
      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogContent>
          {record && (
            <Box mb={2}>
              <Chip label={record.workOrderNumber} size="small" sx={{ mr: 1 }} />
              <Chip label={record.title} size="small" variant="outlined" />
            </Box>
          )}
          <Controller
            name="mechanicIds"
            control={control}
            rules={{ validate: (value) => value.length > 0 || 'Select at least one mechanic' }}
            render={({ field, fieldState }) => (
              <TextField
                {...field}
                fullWidth
                select
                label="Mechanics"
                SelectProps={{ multiple: true }}
                error={Boolean(fieldState.error)}
                helperText={fieldState.error?.message || 'Select one or more mechanics for this work order'}
                value={field.value || []}
                onChange={(e) => field.onChange(typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value)}
              >
                {mechanics.map((m) => (
                  <MenuItem key={m.id} value={m.id}>
                    {m.name}
                  </MenuItem>
                ))}
              </TextField>
            )}
          />
          {record && record.assignedMechanics?.length > 0 && (
            <Typography variant="caption" color="text.secondary" display="block" mt={1}>
              Currently assigned: {getMechanicNames(record)}
            </Typography>
          )}
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
