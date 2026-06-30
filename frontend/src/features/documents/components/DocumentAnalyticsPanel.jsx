import { Card, CardContent, Typography, Grid } from '@mui/material';
import { ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { documentTypeLabels, entityTypeLabels, statusColors } from '../utils/documentUtils';

const COLORS = ['#1565C0', '#ED6C02', '#2E7D32', '#7B1FA2', '#D32F2F', '#00897B', '#5D4037', '#455A64'];

const DocumentAnalyticsPanel = ({ analytics, isLoading }) => {
  if (isLoading || !analytics) return null;

  const { byType = [], byEntity = [], byStatus = [] } = analytics;

  return (
    <Grid container spacing={2}>
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              Documents by Type
            </Typography>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={byType.map((t) => ({ ...t, label: documentTypeLabels[t.type] || t.type }))}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" name="Documents" fill="#1565C0" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              By Status
            </Typography>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={byStatus.map((s) => ({ name: s.status.replace('_', ' '), value: s.count }))}
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
              By Entity
            </Typography>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={byEntity.map((e) => ({ ...e, label: entityTypeLabels[e.entityType] || e.entityType }))} layout="vertical" margin={{ left: 60 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" allowDecimals={false} />
                <YAxis type="category" dataKey="label" tick={{ fontSize: 12 }} width={55} />
                <Tooltip />
                <Bar dataKey="count" name="Documents" fill="#00897B" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
};

export default DocumentAnalyticsPanel;
