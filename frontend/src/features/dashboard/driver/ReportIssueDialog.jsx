import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  Grid,
} from '@mui/material';

const defaultValues = {
  category: 'trip',
  description: '',
};

const ReportIssueDialog = ({ open, onClose, onSubmit, isLoading, activeTrip }) => {
  const { register, handleSubmit, reset, formState: { errors } } = useForm({ defaultValues });

  useEffect(() => {
    if (open) reset(defaultValues);
  }, [open, reset]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Report an Issue</DialogTitle>
      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogContent dividers>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                select
                fullWidth
                label="Issue Category"
                {...register('category', { required: true })}
              >
                <MenuItem value="trip">Trip / Route</MenuItem>
                <MenuItem value="vehicle">Vehicle</MenuItem>
                <MenuItem value="safety">Safety</MenuItem>
                <MenuItem value="other">Other</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={4}
                label="Describe the issue"
                placeholder="Provide details so your dispatcher can assist quickly..."
                {...register('description', {
                  required: 'Please describe the issue',
                  minLength: { value: 10, message: 'Please provide at least 10 characters' },
                })}
                error={!!errors.description}
                helperText={errors.description?.message}
              />
            </Grid>
            {activeTrip && (
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  size="small"
                  label="Linked Trip"
                  value={activeTrip.tripNumber}
                  InputProps={{ readOnly: true }}
                  helperText="This issue will be logged against your active trip"
                />
              </Grid>
            )}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="contained" disabled={isLoading}>
            {isLoading ? 'Submitting...' : 'Submit Report'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default ReportIssueDialog;
