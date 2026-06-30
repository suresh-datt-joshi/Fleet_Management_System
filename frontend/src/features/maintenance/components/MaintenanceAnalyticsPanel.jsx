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
import { formatCurrency, typeLabels } from '../utils/maintenanceUtils';

const COLORS = ['#1565C0', '#ED6C02', '#2E7D32', '#7B1FA2'];

const MaintenanceAnalyticsPanel = ({ analytics, isLoading }) => {
  if (isLoading || !analytics) return null;

  const { monthlyTrend = [], byType = [], byStatus = [] } = analytics;

  return (
    <Grid container spacing={2}>
      <Grid item xs={12} lg={8}>
        <Card>
          <CardContent>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              Work Orders & Cost Trend
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis yAxisId="left" tick={{ fontSize: 12 }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} />
                <Tooltip formatter={(v, name) => (name === 'Cost' ? formatCurrency(v) : v)} />
                <Legend />
                <Line yAxisId="left" type="monotone" dataKey="count" name="Work Orders" stroke="#1565C0" strokeWidth={2} />
                <Line yAxisId="right" type="monotone" dataKey="cost" name="Cost" stroke="#ED6C02" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} lg={4}>
        <Card sx={{ height: '100%' }}>
          <CardContent>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              By Status
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={byStatus.map((s) => ({
                    name: s.status.replace('_', ' '),
                    value: s.count,
                  }))}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  label
                >
                  {byStatus.map((_, i) => (
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
              By Maintenance Type
            </Typography>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={byType.map((t) => ({ ...t, label: typeLabels[t.type] || t.type }))}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="label" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" tickFormatter={(v) => `$${v}`} />
                <Tooltip formatter={(v, name) => (name === 'Cost' ? formatCurrency(v) : v)} />
                <Legend />
                <Bar yAxisId="left" dataKey="count" name="Count" fill="#1565C0" radius={[4, 4, 0, 0]} />
                <Bar yAxisId="right" dataKey="cost" name="Cost" fill="#ED6C02" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
};

export default MaintenanceAnalyticsPanel;
