import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import {
  Card,
  CardContent,
  Typography,
  Grid,
  TextField,
  MenuItem,
  Button,
  FormControlLabel,
  Switch,
  Divider,
} from '@mui/material';
import AddressAutocomplete from '../../maps/components/AddressAutocomplete';
import { TIMEZONES, CURRENCIES, DATE_FORMATS } from '../utils/adminUtils';
import { decimalInputProps, integerInputProps } from '../../../utils/numericInputProps';

const toFormValues = (settings) => ({
  ...settings,
  companyLocation: settings.companyLocation?.address || '',
  companyLocationLat: settings.companyLocation?.lat ?? '',
  companyLocationLng: settings.companyLocation?.lng ?? '',
  companyLocationPlaceId: settings.companyLocation?.placeId || '',
});

const SettingsForm = ({ settings, onSubmit, isLoading }) => {
  const { control, register, handleSubmit, reset, setValue } = useForm();

  useEffect(() => {
    if (settings) reset(toFormValues(settings));
  }, [settings, reset]);

  const submit = (data) => {
    const { companyLocationLat, companyLocationLng, companyLocationPlaceId, ...rest } = data;
    onSubmit({
      ...rest,
      companyLocation: {
        address: data.companyLocation || '',
        lat:
          companyLocationLat !== '' && companyLocationLat != null
            ? Number(companyLocationLat)
            : null,
        lng:
          companyLocationLng !== '' && companyLocationLng != null
            ? Number(companyLocationLng)
            : null,
        placeId: companyLocationPlaceId || '',
      },
    });
  };

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" fontWeight={600} gutterBottom>
          Fleet Settings
        </Typography>
        <form onSubmit={handleSubmit(submit)}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Typography variant="subtitle2" fontWeight={600} color="text.secondary">
                Company Information
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller
                name="companyName"
                control={control}
                render={({ field }) => <TextField {...field} fullWidth label="Company Name" />}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller
                name="companyEmail"
                control={control}
                render={({ field }) => (
                  <TextField {...field} fullWidth label="Company Email" type="email" />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller
                name="companyPhone"
                control={control}
                render={({ field }) => <TextField {...field} fullWidth label="Company Phone" />}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller
                name="timezone"
                control={control}
                render={({ field }) => (
                  <TextField {...field} fullWidth select label="Timezone">
                    {TIMEZONES.map((tz) => (
                      <MenuItem key={tz} value={tz}>
                        {tz}
                      </MenuItem>
                    ))}
                  </TextField>
                )}
              />
            </Grid>
            <Grid item xs={12}>
              <Controller
                name="companyAddress"
                control={control}
                render={({ field }) => (
                  <TextField {...field} fullWidth label="Company Address" multiline rows={2} />
                )}
              />
            </Grid>
            <Grid item xs={12}>
              <Controller
                name="companyLocation"
                control={control}
                render={({ field }) => (
                  <AddressAutocomplete
                    label="Location"
                    value={field.value || ''}
                    onChange={field.onChange}
                    inputKey="fleet-settings-location"
                    onPlaceSelect={(place) => {
                      setValue('companyLocationLat', place.location.lat, { shouldDirty: true });
                      setValue('companyLocationLng', place.location.lng, { shouldDirty: true });
                      setValue('companyLocationPlaceId', place.placeId || '', { shouldDirty: true });
                    }}
                  />
                )}
              />
            </Grid>
            <input type="hidden" {...register('companyLocationLat')} />
            <input type="hidden" {...register('companyLocationLng')} />
            <input type="hidden" {...register('companyLocationPlaceId')} />

            <Grid item xs={12}>
              <Divider sx={{ my: 1 }} />
              <Typography variant="subtitle2" fontWeight={600} color="text.secondary">
                Regional Preferences
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller
                name="currency"
                control={control}
                render={({ field }) => (
                  <TextField {...field} fullWidth select label="Currency">
                    {CURRENCIES.map((c) => (
                      <MenuItem key={c} value={c}>
                        {c}
                      </MenuItem>
                    ))}
                  </TextField>
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller
                name="dateFormat"
                control={control}
                render={({ field }) => (
                  <TextField {...field} fullWidth select label="Date Format">
                    {DATE_FORMATS.map((f) => (
                      <MenuItem key={f} value={f}>
                        {f}
                      </MenuItem>
                    ))}
                  </TextField>
                )}
              />
            </Grid>

            <Grid item xs={12}>
              <Divider sx={{ my: 1 }} />
              <Typography variant="subtitle2" fontWeight={600} color="text.secondary">
                Fleet Thresholds
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <Controller
                name="fuelLowThreshold"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    type="number"
                    label="Low Fuel Threshold (%)"
                    inputProps={{ ...decimalInputProps(0), max: 100 }}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <Controller
                name="maintenanceReminderDays"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    type="number"
                    label="Maintenance Reminder (days)"
                    inputProps={integerInputProps(1, 90)}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <Controller
                name="documentReminderDays"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    type="number"
                    label="Document Reminder (days)"
                    inputProps={integerInputProps(1, 365)}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <Controller
                name="speedLimitKmh"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    type="number"
                    label="Speed Limit (km/h)"
                    inputProps={integerInputProps(1, 200)}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <Controller
                name="gpsUpdateIntervalSeconds"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    type="number"
                    label="GPS Update Interval (sec)"
                    inputProps={integerInputProps(5, 300)}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12}>
              <Divider sx={{ my: 1 }} />
              <Typography variant="subtitle2" fontWeight={600} color="text.secondary">
                System Features
              </Typography>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Controller
                name="alertsEnabled"
                control={control}
                render={({ field }) => (
                  <FormControlLabel control={<Switch checked={Boolean(field.value)} onChange={field.onChange} />} label="Alerts Enabled" />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <Controller
                name="notificationsEnabled"
                control={control}
                render={({ field }) => (
                  <FormControlLabel control={<Switch checked={Boolean(field.value)} onChange={field.onChange} />} label="Notifications Enabled" />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <Controller
                name="autoSyncAlerts"
                control={control}
                render={({ field }) => (
                  <FormControlLabel control={<Switch checked={Boolean(field.value)} onChange={field.onChange} />} label="Auto Sync Alerts" />
                )}
              />
            </Grid>

            <Grid item xs={12}>
              <Button type="submit" variant="contained" disabled={isLoading}>
                Save Settings
              </Button>
            </Grid>
          </Grid>
        </form>
      </CardContent>
    </Card>
  );
};

export default SettingsForm;
