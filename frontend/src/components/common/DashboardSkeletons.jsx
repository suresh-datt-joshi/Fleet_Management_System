import { Card, CardContent, Box, Typography, Skeleton } from '@mui/material';

export const StatCardSkeleton = () => (
  <Card>
    <CardContent>
      <Skeleton width="60%" height={20} />
      <Skeleton width="40%" height={40} sx={{ mt: 1 }} />
    </CardContent>
  </Card>
);

export const ChartSkeleton = () => (
  <Card sx={{ height: 320 }}>
    <CardContent>
      <Skeleton width="30%" height={24} />
      <Skeleton variant="rectangular" height={240} sx={{ mt: 2, borderRadius: 2 }} />
    </CardContent>
  </Card>
);

export default StatCardSkeleton;
