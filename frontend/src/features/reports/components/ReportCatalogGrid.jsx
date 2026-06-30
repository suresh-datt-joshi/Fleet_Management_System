import {
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
  Box,
  Chip,
  CircularProgress,
} from '@mui/material';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { REPORT_CATEGORIES, categoryColors } from '../utils/reportUtils';
import { REPORT_TYPES } from '../utils/reportUtils';

const PREVIEW_TYPES = [REPORT_TYPES.FLEET_SUMMARY, REPORT_TYPES.FINANCIAL, REPORT_TYPES.OPERATIONAL];

const ReportCatalogCard = ({ report, onExport, onPreview, exporting, canExport }) => (
  <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
    <CardContent sx={{ flex: 1 }}>
      <Box display="flex" alignItems="flex-start" justifyContent="space-between" mb={1}>
        <Typography variant="subtitle1" fontWeight={700}>
          {report.title}
        </Typography>
        <Chip
          label={REPORT_CATEGORIES[report.category] || report.category}
          size="small"
          sx={{
            bgcolor: `${categoryColors[report.category] || '#666'}15`,
            color: categoryColors[report.category] || '#666',
            fontWeight: 600,
          }}
        />
      </Box>
      <Typography variant="body2" color="text.secondary" mb={2}>
        {report.description}
      </Typography>
      <Box display="flex" gap={1} flexWrap="wrap">
        {PREVIEW_TYPES.includes(report.type) && (
          <Button size="small" variant="outlined" startIcon={<VisibilityIcon />} onClick={() => onPreview(report.type)}>
            Preview
          </Button>
        )}
        {canExport && (
          <Button
            size="small"
            variant="contained"
            startIcon={exporting ? <CircularProgress size={14} color="inherit" /> : <FileDownloadIcon />}
            onClick={() => onExport(report.type)}
            disabled={exporting}
          >
            Export CSV
          </Button>
        )}
      </Box>
    </CardContent>
  </Card>
);

const ReportCatalogGrid = ({ catalog = [], onExport, onPreview, exportingType, canExport }) => (
  <Grid container spacing={2}>
    {catalog.map((report) => (
      <Grid item xs={12} sm={6} lg={4} key={report.type}>
        <ReportCatalogCard
          report={report}
          onExport={onExport}
          onPreview={onPreview}
          exporting={exportingType === report.type}
          canExport={canExport}
        />
      </Grid>
    ))}
  </Grid>
);

export default ReportCatalogGrid;
