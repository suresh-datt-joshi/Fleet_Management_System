import { Card, CardContent, Typography, Box, useTheme } from '@mui/material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { formatCurrency, formatNumber } from '../../../utils/formatters';

const COLORS = ['#1565C0', '#00897B', '#ED6C02', '#D32F2F', '#7B1FA2'];

const ChartTooltip = ({ active, payload, label, formatter }) => {
  if (!active || !payload?.length) return null;
  return (
    <Box sx={{ bgcolor: 'background.paper', p: 1.5, borderRadius: 1, boxShadow: 2, border: 1, borderColor: 'divider' }}>
      <Typography variant="caption" fontWeight={600}>{label}</Typography>
      {payload.map((entry) => (
        <Typography key={entry.name} variant="caption" display="block" color={entry.color}>
          {entry.name}: {formatter ? formatter(entry.value) : entry.value}
        </Typography>
      ))}
    </Box>
  );
};

export const TripsChart = ({ data }) => {
  const theme = useTheme();
  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Typography variant="h6" fontWeight={600} gutterBottom>
          Trips Overview
        </Typography>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
            <XAxis dataKey="month" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip content={<ChartTooltip formatter={formatNumber} />} />
            <Legend />
            <Bar dataKey="total" name="Total Trips" fill="#1565C0" radius={[4, 4, 0, 0]} />
            <Bar dataKey="completed" name="Completed" fill="#00897B" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export const FuelChart = ({ data }) => (
  <Card sx={{ height: '100%' }}>
    <CardContent>
      <Typography variant="h6" fontWeight={600} gutterBottom>
        Fuel Usage
      </Typography>
      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" tick={{ fontSize: 12 }} />
          <YAxis yAxisId="left" tick={{ fontSize: 12 }} />
          <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} />
          <Tooltip content={<ChartTooltip formatter={(v, name) => (name === 'Cost' ? formatCurrency(v) : `${v} L`)} />} />
          <Legend />
          <Line yAxisId="left" type="monotone" dataKey="quantity" name="Quantity (L)" stroke="#1565C0" strokeWidth={2} dot={{ r: 4 }} />
          <Line yAxisId="right" type="monotone" dataKey="cost" name="Cost" stroke="#ED6C02" strokeWidth={2} dot={{ r: 4 }} />
        </LineChart>
      </ResponsiveContainer>
    </CardContent>
  </Card>
);

export const FinancialChart = ({ data }) => (
  <Card sx={{ height: '100%' }}>
    <CardContent>
      <Typography variant="h6" fontWeight={600} gutterBottom>
        Revenue vs Expenses
      </Typography>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `$${v / 1000}k`} />
          <Tooltip content={<ChartTooltip formatter={formatCurrency} />} />
          <Legend />
          <Bar dataKey="revenue" name="Revenue" fill="#00897B" radius={[4, 4, 0, 0]} />
          <Bar dataKey="expenses" name="Expenses" fill="#D32F2F" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </CardContent>
  </Card>
);

export const VehicleStatusChart = ({ data }) => {
  const chartData = data.map((d) => ({
    name: d.status.charAt(0).toUpperCase() + d.status.slice(1),
    value: d.count,
  }));

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Typography variant="h6" fontWeight={600} gutterBottom>
          Vehicle Status
        </Typography>
        <ResponsiveContainer width="100%" height={280}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
              paddingAngle={4}
              dataKey="value"
              label={({ name, value }) => `${name}: ${value}`}
            >
              {chartData.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default TripsChart;
