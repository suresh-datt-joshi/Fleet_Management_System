import { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  MenuItem,
  Typography,
  Box,
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import { DOCUMENT_TYPES, DOCUMENT_ENTITY_TYPES } from '../../../constants';
import { documentTypeLabels, entityTypeLabels } from '../utils/documentUtils';
import { integerInputProps } from '../../../utils/numericInputProps';

const defaultValues = {
  title: '',
  description: '',
  type: DOCUMENT_TYPES.INSURANCE,
  entityType: DOCUMENT_ENTITY_TYPES.FLEET,
  vehicleId: '',
  driverId: '',
  issueDate: '',
  expiryDate: '',
  reminderDaysBefore: 30,
  notes: '',
};

const DocumentUploadDialog = ({
  open,
  onClose,
  onSubmit,
  initialData,
  isLoading,
  vehicles = [],
  drivers = [],
  isEdit = false,
}) => {
  const [file, setFile] = useState(null);
  const { control, register, handleSubmit, reset, watch } = useForm({ defaultValues });
  const entityType = watch('entityType');

  useEffect(() => {
    if (open) {
      setFile(null);
      if (initialData) {
        reset({
          title: initialData.title || '',
          description: initialData.description || '',
          type: initialData.type || DOCUMENT_TYPES.INSURANCE,
          entityType: initialData.entityType || DOCUMENT_ENTITY_TYPES.FLEET,
          vehicleId: initialData.vehicle?.id || '',
          driverId: initialData.driver?.id || '',
          issueDate: initialData.issueDate ? initialData.issueDate.split('T')[0] : '',
          expiryDate: initialData.expiryDate ? initialData.expiryDate.split('T')[0] : '',
          reminderDaysBefore: initialData.reminderDaysBefore ?? 30,
          notes: initialData.notes || '',
        });
      } else {
        reset(defaultValues);
      }
    }
  }, [open, initialData, reset]);

  const submit = (data) => {
    if (!isEdit && !file) return;
    onSubmit({ ...data, file, id: initialData?.id });
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{isEdit ? 'Edit Document' : 'Upload Document'}</DialogTitle>
      <form onSubmit={handleSubmit(submit)}>
        <DialogContent dividers>
          {!isEdit && (
            <Box
              sx={{
                border: 2,
                borderStyle: 'dashed',
                borderColor: file ? 'primary.main' : 'divider',
                borderRadius: 2,
                p: 3,
                textAlign: 'center',
                mb: 2,
                cursor: 'pointer',
              }}
              onClick={() => document.getElementById('doc-file-input')?.click()}
            >
              <input
                id="doc-file-input"
                type="file"
                hidden
                accept="image/*,.pdf,.doc,.docx"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
              <CloudUploadIcon color={file ? 'primary' : 'disabled'} sx={{ fontSize: 40 }} />
              <Typography variant="body2" mt={1}>
                {file ? file.name : 'Click to select file (PDF, Word, or image)'}
              </Typography>
            </Box>
          )}

          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField fullWidth label="Title" {...register('title', { required: true })} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller
                name="type"
                control={control}
                render={({ field }) => (
                  <TextField {...field} fullWidth select label="Document Type">
                    {Object.values(DOCUMENT_TYPES).map((t) => (
                      <MenuItem key={t} value={t}>
                        {documentTypeLabels[t] || t}
                      </MenuItem>
                    ))}
                  </TextField>
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller
                name="entityType"
                control={control}
                render={({ field }) => (
                  <TextField {...field} fullWidth select label="Linked To">
                    {Object.values(DOCUMENT_ENTITY_TYPES).map((e) => (
                      <MenuItem key={e} value={e}>
                        {entityTypeLabels[e]}
                      </MenuItem>
                    ))}
                  </TextField>
                )}
              />
            </Grid>
            {entityType === DOCUMENT_ENTITY_TYPES.VEHICLE && (
              <Grid item xs={12}>
                <Controller
                  name="vehicleId"
                  control={control}
                  render={({ field }) => (
                    <TextField {...field} fullWidth select label="Vehicle">
                      {vehicles.map((v) => (
                        <MenuItem key={v.id} value={v.id}>
                          {v.vehicleNumber} — {v.model}
                        </MenuItem>
                      ))}
                    </TextField>
                  )}
                />
              </Grid>
            )}
            {entityType === DOCUMENT_ENTITY_TYPES.DRIVER && (
              <Grid item xs={12}>
                <Controller
                  name="driverId"
                  control={control}
                  render={({ field }) => (
                    <TextField {...field} fullWidth select label="Driver">
                      {drivers.map((d) => (
                        <MenuItem key={d.id} value={d.id}>
                          {d.name}
                        </MenuItem>
                      ))}
                    </TextField>
                  )}
                />
              </Grid>
            )}
            <Grid item xs={6}>
              <TextField fullWidth type="date" label="Issue Date" InputLabelProps={{ shrink: true }} {...register('issueDate')} />
            </Grid>
            <Grid item xs={6}>
              <TextField fullWidth type="date" label="Expiry Date" InputLabelProps={{ shrink: true }} {...register('expiryDate')} />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                type="number"
                label="Reminder (days before expiry)"
                inputProps={integerInputProps(1)}
                {...register('reminderDaysBefore')}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Description" multiline rows={2} {...register('description')} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Notes" multiline rows={2} {...register('notes')} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="contained" disabled={isLoading || (!isEdit && !file)}>
            {isEdit ? 'Save' : 'Upload'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default DocumentUploadDialog;
