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
} from 'recharts';
import { formatCurrency } from '../utils/reportUtils';

const FinancialReportPanel = ({ data, isLoading }) => {
  if (isLoading || !data) return null;

  const { monthly = [], totals = {} } = data;

  return (
    <Grid container spacing={2}>
      <Grid item xs={12} md={4}>
        <Card>
          <CardContent>
            <Typography variant="body2" color="text.secondary">
              Total Revenue
            </Typography>
            <Typography variant="h5" fontWeight={700} color="success.main">
              {formatCurrency(totals.revenue)}
            </Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} md={4}>
        <Card>
          <CardContent>
            <Typography variant="body2" color="text.secondary">
              Total Expenses
            </Typography>
            <Typography variant="h5" fontWeight={700} color="error.main">
              {formatCurrency(totals.tripExpenses + totals.fuelCost)}
            </Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} md={4}>
        <Card>
          <CardContent>
            <Typography variant="body2" color="text.secondary">
              Net Profit
            </Typography>
            <Typography variant="h5" fontWeight={700}>
              {formatCurrency(totals.profit)}
            </Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              Monthly Financial Trend
            </Typography>
            <ResponsiveContainer width="100%" height={320}>
              <LineChart data={monthly}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="period" tick={{ fontSize: 11 }} />
                <YAxis tickFormatter={(v) => `$${v}`} />
                <Tooltip formatter={(v) => formatCurrency(v)} />
                <Legend />
                <Line type="monotone" dataKey="revenue" name="Revenue" stroke="#2E7D32" strokeWidth={2} />
                <Line type="monotone" dataKey="tripExpenses" name="Trip Expenses" stroke="#ED6C02" strokeWidth={2} />
                <Line type="monotone" dataKey="fuelCost" name="Fuel Cost" stroke="#1565C0" strokeWidth={2} />
                <Line type="monotone" dataKey="profit" name="Profit" stroke="#7B1FA2" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              Trip Volume by Month
            </Typography>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={monthly}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="period" tick={{ fontSize: 11 }} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="tripCount" name="Trips" fill="#1565C0" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
};

export default FinancialReportPanel;
