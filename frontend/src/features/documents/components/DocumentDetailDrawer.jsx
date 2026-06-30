import {
  Box,
  Button,
  Chip,
  Divider,
  Drawer,
  IconButton,
  Typography,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import DownloadIcon from '@mui/icons-material/Download';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { format } from 'date-fns';
import {
  documentTypeLabels,
  entityTypeLabels,
  statusColors,
  formatFileSize,
  formatDaysUntilExpiry,
} from '../utils/documentUtils';
import { resolveFileUrl } from '../../../redux/api/documentsApi';

const DocumentDetailDrawer = ({ open, onClose, document, onEdit, onDelete, onDownload, canManage }) => {
  if (!document) return null;

  return (
    <Drawer anchor="right" open={open} onClose={onClose} PaperProps={{ sx: { width: { xs: '100%', sm: 420 } } }}>
      <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Box>
          <Typography variant="h6" fontWeight={700}>
            {document.title}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {document.documentNumber}
          </Typography>
          <Box display="flex" gap={0.5} mt={1} flexWrap="wrap">
            <Chip label={documentTypeLabels[document.type] || document.type} size="small" color="primary" variant="outlined" />
            <Chip label={document.status.replace('_', ' ')} size="small" color={statusColors[document.status] || 'default'} sx={{ textTransform: 'capitalize' }} />
          </Box>
        </Box>
        <IconButton onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </Box>

      <Box sx={{ px: 2, pb: 2 }}>
        <DetailRow label="Linked To" value={entityTypeLabels[document.entityType] || document.entityType} />
        {document.vehicle && <DetailRow label="Vehicle" value={document.vehicle.vehicleNumber} />}
        {document.driver && <DetailRow label="Driver" value={document.driver.name} />}
        <DetailRow label="File" value={document.fileName} />
        <DetailRow label="Size" value={formatFileSize(document.fileSize)} />
        {document.issueDate && (
          <DetailRow label="Issue Date" value={format(new Date(document.issueDate), 'MMM d, yyyy')} />
        )}
        {document.expiryDate && (
          <DetailRow label="Expiry Date" value={format(new Date(document.expiryDate), 'MMM d, yyyy')} />
        )}
        <DetailRow label="Expiry Status" value={formatDaysUntilExpiry(document.daysUntilExpiry)} />
        <DetailRow label="Reminder" value={`${document.reminderDaysBefore} days before`} />

        {document.description && (
          <Typography variant="body2" color="text.secondary" mt={2}>
            {document.description}
          </Typography>
        )}
        {document.notes && (
          <Typography variant="body2" color="text.secondary" mt={1}>
            Notes: {document.notes}
          </Typography>
        )}

        <Box display="flex" gap={1} mt={3} flexWrap="wrap">
          <Button size="small" variant="contained" startIcon={<DownloadIcon />} onClick={() => onDownload(document)}>
            Download
          </Button>
          {canManage && (
            <>
              <Button size="small" variant="outlined" startIcon={<EditIcon />} onClick={() => onEdit(document)}>
                Edit
              </Button>
              <Button size="small" variant="outlined" color="error" startIcon={<DeleteIcon />} onClick={() => onDelete(document.id)}>
                Delete
              </Button>
            </>
          )}
        </Box>

        <Divider sx={{ my: 2 }} />
        <Button
          fullWidth
          variant="text"
          onClick={() => window.open(resolveFileUrl(document.fileUrl), '_blank')}
        >
          Open in New Tab
        </Button>
      </Box>
    </Drawer>
  );
};

const DetailRow = ({ label, value }) => (
  <Box display="flex" justifyContent="space-between" py={0.5}>
    <Typography variant="body2" color="text.secondary">
      {label}
    </Typography>
    <Typography variant="body2" fontWeight={500}>
      {value}
    </Typography>
  </Box>
);

export default DocumentDetailDrawer;
