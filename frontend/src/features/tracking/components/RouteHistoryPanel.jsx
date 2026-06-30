import {
  Box,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { format } from 'date-fns';
import { useGetVehicleRouteHistoryQuery } from '../../../redux/api/trackingApi';
import EmptyState from '../../../components/common/EmptyState';

const RouteHistoryPanel = ({ vehicleId, vehicleNumber, routePoints = null }) => {
  const shouldFetch = Boolean(vehicleId) && !routePoints;
  const { data, isLoading, isFetching } = useGetVehicleRouteHistoryQuery(
    { vehicleId, limit: 20, sort: '-recordedAt' },
    { skip: !shouldFetch, pollingInterval: shouldFetch ? 30000 : 0 }
  );

  const route = routePoints || data?.data?.route || [];
  const displayRoute = [...route].slice(-20).reverse();

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
          <Typography variant="h6" fontWeight={600}>
            GPS Breadcrumb Trail
          </Typography>
          {vehicleNumber && (
            <Chip label={vehicleNumber} size="small" color="primary" variant="outlined" />
          )}
        </Box>

        {!vehicleId ? (
          <EmptyState title="Select a vehicle" description="Choose a vehicle to view its GPS breadcrumb trail" />
        ) : shouldFetch && isLoading ? (
          <Box display="flex" justifyContent="center" py={4}>
            <CircularProgress size={32} />
          </Box>
        ) : displayRoute.length === 0 ? (
          <EmptyState title="No history" description="GPS points will appear after tracking updates" />
        ) : (
          <TableContainer sx={{ maxHeight: 420 }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell>Time</TableCell>
                  <TableCell>Speed</TableCell>
                  <TableCell>Fuel</TableCell>
                  <TableCell>Coords</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {displayRoute.map((point, index) => (
                  <TableRow key={point.id || `${point.recordedAt}-${index}`} hover>
                    <TableCell>
                      {point.recordedAt ? format(new Date(point.recordedAt), 'MMM d, HH:mm:ss') : '—'}
                    </TableCell>
                    <TableCell>{Math.round(point.speed || 0)} km/h</TableCell>
                    <TableCell>{Math.round(point.fuelLevel || 0)}%</TableCell>
                    <TableCell>
                      <Typography variant="caption" color="text.secondary">
                        {point.lat?.toFixed(4)}, {point.lng?.toFixed(4)}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
        {isFetching && !isLoading && (
          <Typography variant="caption" color="text.secondary" display="block" mt={1}>
            Refreshing...
          </Typography>
        )}
      </CardContent>
    </Card>
  );
};

export default RouteHistoryPanel;
