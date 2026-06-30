import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Grid,
  MenuItem,
  Tab,
  Tabs,
  TextField,
  Typography,
} from '@mui/material';
import MapIcon from '@mui/icons-material/Map';
import { useState } from 'react';
import {
  useGetMapsConfigQuery,
  useGeocodeAddressMutation,
  useReverseGeocodeMutation,
  useGetDirectionsMutation,
  useGetDistanceMatrixMutation,
} from '../../redux/api/mapsApi';
import AddressAutocomplete from '../../features/maps/components/AddressAutocomplete';
import GoogleRouteMap from '../../features/maps/components/GoogleRouteMap';
import { useGoogleMaps } from '../../contexts/GoogleMapsProvider';
import RouteMap from '../../features/routes/components/RouteMap';
import { TRAVEL_MODES } from '../../features/maps/utils/mapConstants';
import ErrorState from '../../components/common/ErrorState';
import { StatCardSkeleton } from '../../components/common/DashboardSkeletons';

const MapsPage = () => {
  const { data: configData, isLoading, isError, refetch } = useGetMapsConfigQuery();
  const { hasApiKey, isLoaded } = useGoogleMaps();
  const [tab, setTab] = useState(0);

  const [geocodeInput, setGeocodeInput] = useState('');
  const [geocodeResult, setGeocodeResult] = useState(null);

  const [reverseLat, setReverseLat] = useState('40.7128');
  const [reverseLng, setReverseLng] = useState('-74.006');
  const [reverseResult, setReverseResult] = useState(null);

  const [originInput, setOriginInput] = useState('New York, NY');
  const [destInput, setDestInput] = useState('Times Square, New York');
  const [travelMode, setTravelMode] = useState('driving');
  const [directionsResult, setDirectionsResult] = useState(null);

  const [matrixOrigins, setMatrixOrigins] = useState('40.7128,-74.006');
  const [matrixDestinations, setMatrixDestinations] = useState('40.758,-73.9855;40.6892,-74.0445');
  const [matrixResult, setMatrixResult] = useState(null);

  const [geocodeAddress, { isLoading: geocoding }] = useGeocodeAddressMutation();
  const [reverseGeocode, { isLoading: reversing }] = useReverseGeocodeMutation();
  const [getDirections, { isLoading: routing }] = useGetDirectionsMutation();
  const [getDistanceMatrix, { isLoading: matrixing }] = useGetDistanceMatrixMutation();

  const config = configData?.data;
  const useGoogleMap = hasApiKey && isLoaded;

  const parseCoordPairs = (value) =>
    value
      .split(';')
      .map((pair) => pair.trim())
      .filter(Boolean)
      .map((pair) => {
        const [lat, lng] = pair.split(',').map(Number);
        return { lat, lng };
      });

  const handleGeocode = async () => {
    const result = await geocodeAddress({ address: geocodeInput }).unwrap();
    setGeocodeResult(result);
  };

  const handleReverseGeocode = async () => {
    const result = await reverseGeocode({
      lat: Number(reverseLat),
      lng: Number(reverseLng),
    }).unwrap();
    setReverseResult(result);
  };

  const handleDirections = async () => {
    const result = await getDirections({
      origin: { address: originInput },
      destination: { address: destInput },
      mode: travelMode,
    }).unwrap();
    setDirectionsResult(result);
  };

  const handleMatrix = async () => {
    const result = await getDistanceMatrix({
      origins: parseCoordPairs(matrixOrigins),
      destinations: parseCoordPairs(matrixDestinations),
    }).unwrap();
    setMatrixResult(result);
  };

  const directionsPath =
    directionsResult?.routes?.[0]?.polyline?.map((p) => [p.lat, p.lng]) || [];

  const directionsMarkers = directionsPath.length
    ? [
        { type: 'origin', lat: directionsPath[0][0], lng: directionsPath[0][1], label: 'Origin' },
        {
          type: 'destination',
          lat: directionsPath[directionsPath.length - 1][0],
          lng: directionsPath[directionsPath.length - 1][1],
          label: 'Destination',
        },
      ]
    : [];

  if (isError) {
    return <ErrorState message="Failed to load maps configuration" onRetry={refetch} />;
  }

  return (
    <Box>
      <Box display="flex" alignItems="center" gap={2} mb={4}>
        <MapIcon color="primary" sx={{ fontSize: 36 }} />
        <Box>
          <Typography variant="h4" fontWeight={700}>
            Maps & Geocoding
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Geocode addresses, plan routes, and calculate distances via the fleet maps API
          </Typography>
        </Box>
      </Box>

      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} sm={4}>
          {isLoading ? (
            <StatCardSkeleton />
          ) : (
            <Card>
              <CardContent>
                <Typography variant="overline" color="text.secondary">
                  Provider
                </Typography>
                <Typography variant="h5" fontWeight={700} textTransform="capitalize">
                  {config?.provider || '—'}
                </Typography>
              </CardContent>
            </Card>
          )}
        </Grid>
        <Grid item xs={12} sm={4}>
          {isLoading ? (
            <StatCardSkeleton />
          ) : (
            <Card>
              <CardContent>
                <Typography variant="overline" color="text.secondary">
                  Client Maps SDK
                </Typography>
                <Typography variant="h5" fontWeight={700}>
                  {useGoogleMap ? 'Google Maps' : 'Leaflet Fallback'}
                </Typography>
              </CardContent>
            </Card>
          )}
        </Grid>
        <Grid item xs={12} sm={4}>
          {isLoading ? (
            <StatCardSkeleton />
          ) : (
            <Card>
              <CardContent>
                <Typography variant="overline" color="text.secondary">
                  Server API Key
                </Typography>
                <Typography variant="h5" fontWeight={700}>
                  {config?.clientKeyConfigured ? 'Configured' : 'Mock Mode'}
                </Typography>
              </CardContent>
            </Card>
          )}
        </Grid>
      </Grid>

      <Tabs value={tab} onChange={(_, value) => setTab(value)} sx={{ mb: 3 }}>
        <Tab label="Geocode" />
        <Tab label="Reverse Geocode" />
        <Tab label="Directions" />
        <Tab label="Distance Matrix" />
      </Tabs>

      {tab === 0 && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={5}>
            <Card>
              <CardContent>
                <AddressAutocomplete
                  label="Address"
                  value={geocodeInput}
                  onChange={setGeocodeInput}
                  onPlaceSelect={(place) => {
                    setGeocodeInput(place.address);
                    setGeocodeResult({ results: [place], provider: config?.provider });
                  }}
                />
                <Button
                  variant="contained"
                  sx={{ mt: 2 }}
                  onClick={handleGeocode}
                  disabled={geocoding || !geocodeInput.trim()}
                >
                  Geocode
                </Button>
                {geocodeResult?.results?.[0] && (
                  <Box mt={2}>
                    <Typography variant="body2" fontWeight={600}>
                      {geocodeResult.results[0].formattedAddress || geocodeResult.results[0].address}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {geocodeResult.results[0].location?.lat},{' '}
                      {geocodeResult.results[0].location?.lng}
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={7}>
            {geocodeResult?.results?.[0]?.location &&
              (useGoogleMap ? (
                <GoogleRouteMap
                  path={[
                    [
                      geocodeResult.results[0].location.lat,
                      geocodeResult.results[0].location.lng,
                    ],
                  ]}
                  markers={[
                    {
                      type: 'origin',
                      ...geocodeResult.results[0].location,
                      label: 'Result',
                    },
                  ]}
                  height={360}
                />
              ) : (
                <RouteMap
                  path={[
                    [
                      geocodeResult.results[0].location.lat,
                      geocodeResult.results[0].location.lng,
                    ],
                  ]}
                  markers={[
                    {
                      type: 'origin',
                      ...geocodeResult.results[0].location,
                      label: 'Result',
                    },
                  ]}
                  height={360}
                />
              ))}
          </Grid>
        </Grid>
      )}

      {tab === 1 && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={5}>
            <Card>
              <CardContent>
                <TextField
                  label="Latitude"
                  value={reverseLat}
                  onChange={(e) => setReverseLat(e.target.value)}
                  fullWidth
                  size="small"
                  sx={{ mb: 2 }}
                />
                <TextField
                  label="Longitude"
                  value={reverseLng}
                  onChange={(e) => setReverseLng(e.target.value)}
                  fullWidth
                  size="small"
                />
                <Button
                  variant="contained"
                  sx={{ mt: 2 }}
                  onClick={handleReverseGeocode}
                  disabled={reversing}
                >
                  Reverse Geocode
                </Button>
                {reverseResult?.results?.[0] && (
                  <Typography variant="body2" sx={{ mt: 2 }}>
                    {reverseResult.results[0].formattedAddress}
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={7}>
            {reverseResult?.results?.[0]?.location &&
              (useGoogleMap ? (
                <GoogleRouteMap
                  path={[[Number(reverseLat), Number(reverseLng)]]}
                  markers={[
                    {
                      type: 'origin',
                      lat: Number(reverseLat),
                      lng: Number(reverseLng),
                      label: 'Location',
                    },
                  ]}
                  height={360}
                />
              ) : (
                <RouteMap
                  path={[[Number(reverseLat), Number(reverseLng)]]}
                  markers={[
                    {
                      type: 'origin',
                      lat: Number(reverseLat),
                      lng: Number(reverseLng),
                      label: 'Location',
                    },
                  ]}
                  height={360}
                />
              ))}
          </Grid>
        </Grid>
      )}

      {tab === 2 && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={5}>
            <Card>
              <CardContent>
                <AddressAutocomplete
                  label="Origin"
                  value={originInput}
                  onChange={setOriginInput}
                  helperText="Start location"
                />
                <Box mt={2}>
                  <AddressAutocomplete
                    label="Destination"
                    value={destInput}
                    onChange={setDestInput}
                    helperText="End location"
                  />
                </Box>
                <TextField
                  select
                  label="Travel mode"
                  value={travelMode}
                  onChange={(e) => setTravelMode(e.target.value)}
                  fullWidth
                  size="small"
                  sx={{ mt: 2 }}
                >
                  {TRAVEL_MODES.map((mode) => (
                    <MenuItem key={mode.value} value={mode.value}>
                      {mode.label}
                    </MenuItem>
                  ))}
                </TextField>
                <Button
                  variant="contained"
                  sx={{ mt: 2 }}
                  onClick={handleDirections}
                  disabled={routing}
                >
                  Get Directions
                </Button>
                {directionsResult?.routes?.[0] && (
                  <Box mt={2} display="flex" gap={1} flexWrap="wrap">
                    <Chip label={directionsResult.routes[0].distanceText} size="small" />
                    <Chip label={directionsResult.routes[0].durationText} size="small" color="primary" />
                    <Chip
                      label={`Provider: ${directionsResult.provider}`}
                      size="small"
                      variant="outlined"
                    />
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={7}>
            {directionsPath.length > 0 &&
              (useGoogleMap ? (
                <GoogleRouteMap path={directionsPath} markers={directionsMarkers} height={420} />
              ) : (
                <RouteMap path={directionsPath} markers={directionsMarkers} height={420} />
              ))}
          </Grid>
        </Grid>
      )}

      {tab === 3 && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={5}>
            <Card>
              <CardContent>
                <TextField
                  label="Origins (lat,lng; lat,lng)"
                  value={matrixOrigins}
                  onChange={(e) => setMatrixOrigins(e.target.value)}
                  fullWidth
                  size="small"
                  helperText="Semicolon-separated coordinate pairs"
                  sx={{ mb: 2 }}
                />
                <TextField
                  label="Destinations (lat,lng; lat,lng)"
                  value={matrixDestinations}
                  onChange={(e) => setMatrixDestinations(e.target.value)}
                  fullWidth
                  size="small"
                />
                <Button
                  variant="contained"
                  sx={{ mt: 2 }}
                  onClick={handleMatrix}
                  disabled={matrixing}
                >
                  Calculate Matrix
                </Button>
                {matrixResult?.rows?.map((row, rowIndex) => (
                  <Box key={rowIndex} mt={2}>
                    <Typography variant="subtitle2">Origin {rowIndex + 1}</Typography>
                    {row.elements.map((element, colIndex) => (
                      <Typography key={colIndex} variant="body2" color="text.secondary">
                        → Dest {colIndex + 1}: {element.distanceText} ({element.durationText})
                      </Typography>
                    ))}
                  </Box>
                ))}
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={7}>
            {matrixResult && (
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Typography variant="h6" fontWeight={600} gutterBottom>
                    Distance Matrix Results
                  </Typography>
                  <Chip
                    label={`Provider: ${matrixResult.provider}`}
                    size="small"
                    variant="outlined"
                    sx={{ mb: 2 }}
                  />
                  {matrixResult.rows?.map((row, rowIndex) => (
                    <Box key={rowIndex} mb={2}>
                      <Typography variant="subtitle2" gutterBottom>
                        From origin {rowIndex + 1}
                      </Typography>
                      {row.elements.map((element, colIndex) => (
                        <Typography key={colIndex} variant="body2">
                          Destination {colIndex + 1}: {element.status} — {element.distanceText},{' '}
                          {element.durationText}
                        </Typography>
                      ))}
                    </Box>
                  ))}
                </CardContent>
              </Card>
            )}
          </Grid>
        </Grid>
      )}
    </Box>
  );
};

export default MapsPage;
