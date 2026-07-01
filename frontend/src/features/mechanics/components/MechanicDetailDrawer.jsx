import {
  Drawer,
  Box,
  Typography,
  IconButton,
  Chip,
  Divider,
  Grid,
  Avatar,
  Button,
  List,
  ListItem,
  ListItemText,
  LinearProgress,
  MenuItem,
  TextField,
  CircularProgress,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DeleteIcon from '@mui/icons-material/Delete';
import DescriptionIcon from '@mui/icons-material/Description';
import { useRef, useState } from 'react';
import { statusColors, documentTypeLabels } from '../utils/mechanicUtils';
import { formatRelativeTime } from '../../../utils/formatters';
import { useGetMechanicHistoryQuery } from '../../../redux/api/mechanicsApi';
import { API_BASE_URL, MECHANIC_SPECIALIZATION_LABELS } from '../../../constants';

const DetailItem = ({ label, value }) => (
  <Grid item xs={6}>
    <Typography variant="caption" color="text.secondary" display="block">{label}</Typography>
    <Typography variant="body2" fontWeight={500}>{value ?? '—'}</Typography>
  </Grid>
);

const getAssetUrl = (url) => {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  return `${API_BASE_URL.replace('/api/v1', '')}${url}`;
};

const formatDate = (d) => (d ? new Date(d).toLocaleDateString() : '—');

const MechanicDetailDrawer = ({
  open,
  onClose,
  mechanic,
  onEdit,
  onDelete,
  onUploadAvatar,
  onUploadDocument,
  onDeleteDocument,
  canUpdate,
  canDelete,
  isUploading,
}) => {
  const avatarRef = useRef(null);
  const docRef = useRef(null);
  const [docType, setDocType] = useState('certification');
  const [docName, setDocName] = useState('');
  const [docExpiry, setDocExpiry] = useState('');

  const { data: historyData, isLoading: historyLoading } = useGetMechanicHistoryQuery(
    { id: mechanic?._id, limit: 10 },
    { skip: !mechanic?._id || !open }
  );

  if (!mechanic) return null;

  const history = historyData?.data?.history || [];

  const handleDocUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      onUploadDocument({ file, type: docType, name: docName || file.name, expiryDate: docExpiry || undefined });
      setDocName('');
      setDocExpiry('');
    }
    e.target.value = '';
  };

  return (
    <Drawer anchor="right" open={open} onClose={onClose} PaperProps={{ sx: { width: { xs: '100%', sm: 480 } } }}>
      <Box sx={{ p: 2.5, height: '100%', overflow: 'auto' }}>
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
          <Typography variant="h5" fontWeight={700}>
            {mechanic.firstName} {mechanic.lastName}
          </Typography>
          <IconButton onClick={onClose}><CloseIcon /></IconButton>
        </Box>

        <Box display="flex" alignItems="center" gap={2} mb={2}>
          <Avatar
            src={getAssetUrl(mechanic.avatar)}
            sx={{ width: 64, height: 64, bgcolor: 'primary.main', fontSize: 24 }}
          >
            {mechanic.firstName?.[0]}{mechanic.lastName?.[0]}
          </Avatar>
          <Box>
            <Chip
              label={mechanic.status?.replace('_', ' ')}
              color={statusColors[mechanic.status] || 'default'}
              size="small"
              sx={{ textTransform: 'capitalize', mb: 0.5 }}
            />
            <Typography variant="body2" color="text.secondary">{mechanic.employeeId || 'No employee ID'}</Typography>
          </Box>
        </Box>

        <Box mb={2}>
          <Typography variant="caption" color="text.secondary">Performance Score</Typography>
          <Box display="flex" alignItems="center" gap={1}>
            <LinearProgress variant="determinate" value={mechanic.performanceScore || 0} sx={{ flex: 1, height: 8, borderRadius: 4 }} />
            <Typography variant="body2" fontWeight={700}>{mechanic.performanceScore}%</Typography>
          </Box>
        </Box>

        <Grid container spacing={2} mb={2}>
          <DetailItem label="Email" value={mechanic.email} />
          <DetailItem label="Phone" value={mechanic.phone} />
          <DetailItem label="Certification" value={mechanic.certificationNumber} />
          <DetailItem label="Certification Expiry" value={formatDate(mechanic.certificationExpiry)} />
          <DetailItem
            label="Specialization"
            value={MECHANIC_SPECIALIZATION_LABELS[mechanic.specialization] || mechanic.specialization}
          />
          <DetailItem label="Experience" value={`${mechanic.experienceYears || 0} years`} />
          <DetailItem
            label="Linked Account"
            value={mechanic.user ? `${mechanic.user.firstName} ${mechanic.user.lastName}` : 'Not linked'}
          />
        </Grid>

        {canUpdate && (
          <>
            <Divider sx={{ my: 2 }} />
            <Typography variant="subtitle2" fontWeight={600} gutterBottom>Photo & Documents</Typography>
            <input ref={avatarRef} type="file" accept="image/*" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) onUploadAvatar(f); e.target.value = ''; }} />
            <Button size="small" variant="outlined" startIcon={isUploading ? <CircularProgress size={16} /> : <CloudUploadIcon />} onClick={() => avatarRef.current?.click()} disabled={isUploading} sx={{ mb: 2 }}>
              Upload Photo
            </Button>

            <Grid container spacing={1} mb={1}>
              <Grid item xs={12} sm={4}>
                <TextField select fullWidth size="small" label="Doc Type" value={docType} onChange={(e) => setDocType(e.target.value)}>
                  {Object.entries(documentTypeLabels).map(([k, v]) => (
                    <MenuItem key={k} value={k}>{v}</MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField fullWidth size="small" label="Name" value={docName} onChange={(e) => setDocName(e.target.value)} />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField fullWidth size="small" label="Expiry" type="date" value={docExpiry} onChange={(e) => setDocExpiry(e.target.value)} InputLabelProps={{ shrink: true }} />
              </Grid>
            </Grid>
            <input ref={docRef} type="file" accept="image/*,application/pdf" hidden onChange={handleDocUpload} />
            <Button size="small" variant="outlined" startIcon={<DescriptionIcon />} onClick={() => docRef.current?.click()} sx={{ mb: 1 }}>
              Upload Document
            </Button>
            <List dense disablePadding>
              {(mechanic.documents || []).map((doc) => (
                <ListItem key={doc._id} sx={{ px: 0 }} secondaryAction={
                  <IconButton edge="end" size="small" onClick={() => onDeleteDocument(doc._id)}><DeleteIcon fontSize="small" color="error" /></IconButton>
                }>
                  <ListItemText
                    primary={doc.name}
                    secondary={`${documentTypeLabels[doc.type] || doc.type}${doc.expiryDate ? ` · Exp: ${formatDate(doc.expiryDate)}` : ''}`}
                  />
                </ListItem>
              ))}
            </List>
          </>
        )}

        {mechanic.notes && (
          <>
            <Divider sx={{ my: 2 }} />
            <Typography variant="subtitle2" fontWeight={600} gutterBottom>Notes</Typography>
            <Typography variant="body2" color="text.secondary">{mechanic.notes}</Typography>
          </>
        )}

        <Divider sx={{ my: 2 }} />
        <Typography variant="subtitle2" fontWeight={600} gutterBottom>History</Typography>
        {historyLoading ? <CircularProgress size={24} /> : (
          <List dense disablePadding>
            {history.map((h) => (
              <ListItem key={h._id} sx={{ px: 0 }}>
                <ListItemText
                  primary={h.description}
                  secondary={<>{formatRelativeTime(h.createdAt)}{h.performedBy && ` · ${h.performedBy.firstName} ${h.performedBy.lastName}`}</>}
                  primaryTypographyProps={{ variant: 'body2' }}
                  secondaryTypographyProps={{ variant: 'caption' }}
                />
              </ListItem>
            ))}
          </List>
        )}

        <Box display="flex" gap={1} mt={3}>
          {canUpdate && <Button variant="contained" onClick={onEdit} fullWidth>Edit</Button>}
          {canDelete && <Button variant="outlined" color="error" onClick={onDelete} fullWidth>Delete</Button>}
        </Box>
      </Box>
    </Drawer>
  );
};

export default MechanicDetailDrawer;
