import { Card, CardContent, Typography, Grid, Chip } from '@mui/material';
import { formatNumber } from '../utils/reportUtils';

const OperationalReportPanel = ({ data, isLoading }) => {
  if (isLoading || !data) return null;

  const { trips, fleet, maintenance, alerts } = data;

  return (
    <Grid container spacing={2}>
      <Grid item xs={6} sm={3}>
        <Card>
          <CardContent>
            <Typography variant="body2" color="text.secondary">
              Total Trips
            </Typography>
            <Typography variant="h5" fontWeight={700}>
              {formatNumber(trips.total)}
            </Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={6} sm={3}>
        <Card>
          <CardContent>
            <Typography variant="body2" color="text.secondary">
              Completion Rate
            </Typography>
            <Typography variant="h5" fontWeight={700} color="success.main">
              {trips.completionRate}%
            </Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={6} sm={3}>
        <Card>
          <CardContent>
            <Typography variant="body2" color="text.secondary">
              Active Vehicles
            </Typography>
            <Typography variant="h5" fontWeight={700}>
              {formatNumber(fleet.activeVehicles)}
            </Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={6} sm={3}>
        <Card>
          <CardContent>
            <Typography variant="body2" color="text.secondary">
              Avg Trip Distance
            </Typography>
            <Typography variant="h5" fontWeight={700}>
              {trips.avgDistance} km
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={6}>
        <Card sx={{ height: '100%' }}>
          <CardContent>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              Trip Status Breakdown
            </Typography>
            <Grid container spacing={1}>
              {(trips.byStatus || []).map((t) => (
                <Grid item key={t.status}>
                  <Chip label={`${t.status.replace('_', ' ')}: ${t.count}`} variant="outlined" />
                </Grid>
              ))}
            </Grid>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={6}>
        <Card sx={{ height: '100%' }}>
          <CardContent>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              Fleet Health
            </Typography>
            <Typography variant="body2" py={0.5}>
              Avg Odometer: {formatNumber(fleet.avgOdometer)} km
            </Typography>
            <Typography variant="body2" py={0.5}>
              Avg Fuel Level: {fleet.avgFuelLevel}%
            </Typography>
            <Typography variant="body2" py={0.5} color={fleet.lowFuelVehicles > 0 ? 'error.main' : 'text.primary'}>
              Low Fuel Vehicles: {fleet.lowFuelVehicles}
            </Typography>
            <Typography variant="body2" py={0.5}>
              Total Distance: {formatNumber(trips.totalDistance)} km
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              Maintenance Status
            </Typography>
            <Grid container spacing={1}>
              {(maintenance.byStatus || []).map((m) => (
                <Grid item key={m.status}>
                  <Chip label={`${m.status.replace('_', ' ')}: ${m.count}`} size="small" />
                </Grid>
              ))}
            </Grid>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              Alerts by Severity
            </Typography>
            <Grid container spacing={1}>
              {(alerts.bySeverity || []).map((a) => (
                <Grid item key={a.severity}>
                  <Chip
                    label={`${a.severity}: ${a.count} (${a.unread} unread)`}
                    size="small"
                    color={a.severity === 'critical' ? 'error' : a.severity === 'high' ? 'warning' : 'default'}
                  />
                </Grid>
              ))}
            </Grid>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
};

export default OperationalReportPanel;
