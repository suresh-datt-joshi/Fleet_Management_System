import { Card, CardContent, Typography, Grid } from '@mui/material';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { alertTypeLabels, severityLabels } from '../utils/alertUtils';

const COLORS = ['#1565C0', '#ED6C02', '#D32F2F', '#7B1FA2', '#00897B', '#455A64'];

const AlertAnalyticsPanel = ({ analytics, isLoading }) => {
  if (isLoading || !analytics) return null;

  const { dailyTrend = [], bySeverity = [], byType = [] } = analytics;

  return (
    <Grid container spacing={2}>
      <Grid item xs={12} lg={8}>
        <Card>
          <CardContent>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              Daily Alert Trend
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={dailyTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="count" name="Alerts" stroke="#D32F2F" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} lg={4}>
        <Card sx={{ height: '100%' }}>
          <CardContent>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              By Severity
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={bySeverity.map((s) => ({
                    name: severityLabels[s.severity] || s.severity,
                    value: s.count,
                  }))}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  label
                >
                  {bySeverity.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              By Alert Type
            </Typography>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={byType.map((t) => ({ ...t, label: alertTypeLabels[t.type] || t.type }))}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" name="Alerts" fill="#1565C0" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
};

export default AlertAnalyticsPanel;
