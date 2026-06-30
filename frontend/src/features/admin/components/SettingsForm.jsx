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
import { TIMEZONES, CURRENCIES, DATE_FORMATS } from '../utils/adminUtils';
import { decimalInputProps, integerInputProps } from '../../../utils/numericInputProps';

const SettingsForm = ({ settings, onSubmit, isLoading }) => {
  const { control, register, handleSubmit, reset } = useForm();

  useEffect(() => {
    if (settings) reset(settings);
  }, [settings, reset]);

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" fontWeight={600} gutterBottom>
          Fleet Settings
        </Typography>
        <form onSubmit={handleSubmit(onSubmit)}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Typography variant="subtitle2" fontWeight={600} color="text.secondary">
                Company Information
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Company Name" {...register('companyName')} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Company Email" type="email" {...register('companyEmail')} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Company Phone" {...register('companyPhone')} />
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
              <TextField fullWidth label="Company Address" multiline rows={2} {...register('companyAddress')} />
            </Grid>

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
              <TextField
                fullWidth
                type="number"
                label="Low Fuel Threshold (%)"
                inputProps={{ ...decimalInputProps(0), max: 100 }}
                {...register('fuelLowThreshold')}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <TextField
                fullWidth
                type="number"
                label="Maintenance Reminder (days)"
                inputProps={integerInputProps(1, 90)}
                {...register('maintenanceReminderDays')}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <TextField
                fullWidth
                type="number"
                label="Document Reminder (days)"
                inputProps={integerInputProps(1, 365)}
                {...register('documentReminderDays')}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <TextField
                fullWidth
                type="number"
                label="Speed Limit (km/h)"
                inputProps={integerInputProps(1, 200)}
                {...register('speedLimitKmh')}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <TextField
                fullWidth
                type="number"
                label="GPS Update Interval (sec)"
                inputProps={integerInputProps(5, 300)}
                {...register('gpsUpdateIntervalSeconds')}
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
