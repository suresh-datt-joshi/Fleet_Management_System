import { Card, CardContent, Typography, Grid } from '@mui/material';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { formatCurrency, fuelTypeLabels } from '../utils/fuelUtils';

const COLORS = ['#1565C0', '#ED6C02', '#2E7D32', '#7B1FA2', '#D32F2F'];

const FuelAnalyticsPanel = ({ analytics, isLoading }) => {
  if (isLoading || !analytics) return null;

  const { monthlyTrend = [], topVehicles = [], byFuelType = [], topStations = [] } = analytics;

  return (
    <Grid container spacing={2}>
      <Grid item xs={12} lg={8}>
        <Card>
          <CardContent>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              Fuel Usage & Cost Trend
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis yAxisId="left" tick={{ fontSize: 12 }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} />
                <Tooltip formatter={(v, name) => (name === 'Cost' ? formatCurrency(v) : `${v} L`)} />
                <Legend />
                <Line yAxisId="left" type="monotone" dataKey="quantity" name="Quantity (L)" stroke="#1565C0" strokeWidth={2} />
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
              By Fuel Type
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={byFuelType.map((f) => ({ name: fuelTypeLabels[f.fuelType] || f.fuelType, value: f.cost }))}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {byFuelType.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => formatCurrency(v)} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              Top Vehicles by Fuel Cost
            </Typography>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={topVehicles} layout="vertical" margin={{ left: 60 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" tickFormatter={(v) => `$${v}`} />
                <YAxis type="category" dataKey="vehicleNumber" tick={{ fontSize: 11 }} width={55} />
                <Tooltip formatter={(v) => formatCurrency(v)} />
                <Bar dataKey="cost" name="Cost" fill="#1565C0" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              Top Stations by Spend
            </Typography>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={topStations}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tickFormatter={(v) => `$${v}`} />
                <Tooltip formatter={(v) => formatCurrency(v)} />
                <Bar dataKey="cost" name="Cost" fill="#00897B" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
};

export default FuelAnalyticsPanel;
