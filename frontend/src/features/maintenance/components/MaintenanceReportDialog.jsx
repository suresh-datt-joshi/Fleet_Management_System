import { useEffect } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  IconButton,
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import CloseIcon from '@mui/icons-material/Close';
import { decimalInputProps, integerInputProps, moneyInputProps } from '../../../utils/numericInputProps';
import { formatCurrency, getMechanicNames } from '../utils/maintenanceUtils';

const defaultPart = () => ({ name: '', quantity: 1, cost: 0, supplier: '' });

const defaultValues = {
  workPerformed: '',
  laborHours: '',
  laborCost: '',
  odometerAtService: '',
  completedDate: new Date().toISOString().slice(0, 16),
  notes: '',
  parts: [defaultPart()],
  files: [],
};

const MaintenanceReportDialog = ({ open, onClose, onSubmit, record, isLoading }) => {
  const { control, register, handleSubmit, reset, watch, setValue } = useForm({ defaultValues });
  const { fields, append, remove } = useFieldArray({ control, name: 'parts' });

  useEffect(() => {
    if (open && record) {
      reset({
        workPerformed: record.workPerformed || '',
        laborHours: record.laborHours || '',
        laborCost: record.laborCost || '',
        odometerAtService: record.odometerAtService || record.vehicle?.odometer || '',
        completedDate: new Date().toISOString().slice(0, 16),
        notes: record.notes || '',
        parts: record.parts?.length
          ? record.parts.map((p) => ({
              name: p.name,
              quantity: p.quantity,
              cost: p.cost,
              supplier: p.supplier || '',
            }))
          : [defaultPart()],
      });
      setValue('files', []);
    }
  }, [open, record, reset, setValue]);

  const selectedFiles = watch('files') || [];

  const handleFileChange = (event) => {
    const newFiles = Array.from(event.target.files || []);
    setValue('files', [...selectedFiles, ...newFiles]);
    event.target.value = '';
  };

  const removeFile = (index) => {
    setValue(
      'files',
      selectedFiles.filter((_, i) => i !== index)
    );
  };

  const submit = (data) => {
    onSubmit({
      workPerformed: data.workPerformed,
      laborHours: Number(data.laborHours || 0),
      laborCost: Number(data.laborCost || 0),
      odometerAtService: Number(data.odometerAtService || 0),
      completedDate: new Date(data.completedDate).toISOString(),
      notes: data.notes,
      parts: data.parts
        .filter((p) => p.name.trim())
        .map((p) => ({
          name: p.name,
          quantity: Number(p.quantity || 1),
          cost: Number(p.cost || 0),
          supplier: p.supplier || '',
        })),
      files: data.files || [],
      vehicleId: record?.vehicle?.id,
    });
  };

  if (!record) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Submit Maintenance Report</DialogTitle>
      <form onSubmit={handleSubmit(submit)}>
        <DialogContent dividers>
          <Box mb={2}>
            <Typography variant="subtitle2" color="text.secondary">
              {record.workOrderNumber} — {record.title}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {record.vehicle?.vehicleNumber} · {getMechanicNames(record)}
            </Typography>
          </Box>

          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Work Performed"
                multiline
                rows={4}
                required
                {...register('workPerformed', { required: 'Describe all work performed' })}
              />
            </Grid>
            <Grid item xs={6} sm={3}>
              <TextField
                fullWidth
                type="number"
                label="Labor Hours"
                inputProps={decimalInputProps()}
                {...register('laborHours')}
              />
            </Grid>
            <Grid item xs={6} sm={3}>
              <TextField
                fullWidth
                type="number"
                label="Labor Cost ($)"
                inputProps={moneyInputProps()}
                {...register('laborCost')}
              />
            </Grid>
            <Grid item xs={6} sm={3}>
              <TextField
                fullWidth
                type="number"
                label="Odometer (km)"
                inputProps={decimalInputProps()}
                {...register('odometerAtService')}
              />
            </Grid>
            <Grid item xs={6} sm={3}>
              <TextField
                fullWidth
                type="datetime-local"
                label="Completion Date"
                InputLabelProps={{ shrink: true }}
                {...register('completedDate', { required: true })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Notes" multiline rows={2} {...register('notes')} />
            </Grid>
          </Grid>

          <Typography variant="subtitle2" fontWeight={700} mt={2} mb={1}>
            Parts Used / Replaced
          </Typography>
          {fields.map((field, index) => (
            <Box key={field.id} display="flex" gap={1} mb={1} alignItems="center" flexWrap="wrap">
              <TextField size="small" label="Part Name" {...register(`parts.${index}.name`)} sx={{ flex: 2, minWidth: 140 }} />
              <TextField
                size="small"
                type="number"
                label="Qty"
                inputProps={integerInputProps(1)}
                {...register(`parts.${index}.quantity`)}
                sx={{ width: 80 }}
              />
              <TextField
                size="small"
                type="number"
                label="Unit Cost"
                inputProps={moneyInputProps()}
                {...register(`parts.${index}.cost`)}
                sx={{ width: 100 }}
              />
              <TextField size="small" label="Supplier" {...register(`parts.${index}.supplier`)} sx={{ flex: 1, minWidth: 120 }} />
              {fields.length > 1 && (
                <IconButton size="small" color="error" onClick={() => remove(index)}>
                  <DeleteIcon fontSize="small" />
                </IconButton>
              )}
            </Box>
          ))}
          <Button size="small" startIcon={<AddIcon />} onClick={() => append(defaultPart())}>
            Add Part
          </Button>

          <Typography variant="subtitle2" fontWeight={700} mt={3} mb={1}>
            Invoices, Bills & Receipts
          </Typography>
          <Button variant="outlined" component="label" startIcon={<AttachFileIcon />} size="small">
            Upload Documents
            <input type="file" hidden multiple accept="image/*,.pdf,.doc,.docx" onChange={handleFileChange} />
          </Button>
          {selectedFiles.length > 0 && (
            <List dense sx={{ mt: 1 }}>
              {selectedFiles.map((file, index) => (
                <ListItem key={`${file.name}-${index}`}>
                  <ListItemText primary={file.name} secondary={`${(file.size / 1024).toFixed(1)} KB`} />
                  <ListItemSecondaryAction>
                    <IconButton edge="end" size="small" onClick={() => removeFile(index)}>
                      <CloseIcon fontSize="small" />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>
          )}
          <Typography variant="caption" color="text.secondary" display="block" mt={1}>
            Accepted: images, PDF, Word documents (max 10 MB each)
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="contained" color="success" disabled={isLoading}>
            Submit Report & Complete
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default MaintenanceReportDialog;
