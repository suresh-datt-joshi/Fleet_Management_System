import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  CircularProgress,
} from '@mui/material';

const defaultValues = {
  workPerformed: '',
  notes: '',
};

const UpdateProgressDialog = ({ open, onClose, onSubmit, record, isLoading }) => {
  const { register, handleSubmit, reset } = useForm({ defaultValues });

  useEffect(() => {
    if (open && record) {
      reset({
        workPerformed: record.workPerformed || '',
        notes: record.notes || '',
      });
    }
  }, [open, record, reset]);

  if (!record) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Update Progress</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" mb={2}>
          {record.workOrderNumber} — {record.title}
        </Typography>
        <TextField
          {...register('workPerformed')}
          label="Work performed so far"
          multiline
          rows={4}
          fullWidth
          margin="normal"
          placeholder="Describe repairs, inspections, or tasks completed..."
        />
        <TextField
          {...register('notes')}
          label="Notes"
          multiline
          rows={2}
          fullWidth
          margin="normal"
          placeholder="Additional notes or blockers..."
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          variant="contained"
          onClick={handleSubmit(onSubmit)}
          disabled={isLoading}
          startIcon={isLoading ? <CircularProgress size={16} color="inherit" /> : null}
        >
          Save Progress
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default UpdateProgressDialog;
