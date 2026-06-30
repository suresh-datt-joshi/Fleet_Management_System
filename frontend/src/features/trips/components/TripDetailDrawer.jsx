import {
  Box,
  Button,
  Chip,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Typography,
  CircularProgress,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import RateReviewIcon from '@mui/icons-material/RateReview';
import ReceiptIcon from '@mui/icons-material/Receipt';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { useGetTripHistoryQuery, useGetTripQuery, resolveReceiptUrl } from '../../../redux/api/tripsApi';
import {
  statusColors,
  statusLabels,
  formatDistance,
  formatLocation,
  formatCurrency,
  expenseCategoryLabels,
  consignmentStatusLabels,
  consignmentStatusColors,
  canStart,
  canComplete,
  canReview,
  canCancel,
  canEdit,
  canDelete,
  TRIP_STATUS,
} from '../utils/tripUtils';

const TripDetailDrawer = ({
  open,
  onClose,
  trip,
  onEdit,
  onStart,
  onComplete,
  onCancel,
  onDelete,
  canUpdate,
  canReview: canReviewPerm,
  canDeletePerm,
  loadingAction,
}) => {
  const navigate = useNavigate();
  const { data: tripDetailData } = useGetTripQuery(trip?.id, { skip: !trip?.id || !open });
  const { data: historyData, isLoading: historyLoading } = useGetTripHistoryQuery(
    { id: trip?.id, limit: 10, sort: 'createdAt:desc' },
    { skip: !trip?.id || !open }
  );

  if (!trip) return null;

  const detail = tripDetailData?.data?.trip || trip;
  const history = historyData?.data?.history || [];
  const expenses = detail.expenseDetails?.expenses || [];
  const expenseSummary = detail.expenseDetails?.summary;

  return (
    <Drawer anchor="right" open={open} onClose={onClose} PaperProps={{ sx: { width: { xs: '100%', sm: 440 } } }}>
      <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Box>
          <Typography variant="h6" fontWeight={700}>
            {trip.tripNumber}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {detail.route ? `${detail.route.routeNumber} — ${detail.route.name}` : 'Manual route'}
          </Typography>
          <Box display="flex" gap={0.5} mt={1}>
            <Chip
              label={statusLabels[detail.status] || detail.status}
              size="small"
              color={statusColors[detail.status] || 'default'}
            />
          </Box>
        </Box>
        <IconButton onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </Box>

      <Box sx={{ px: 2, pb: 2 }}>
        <GridRow label="Driver" value={detail.driver?.name || '—'} />
        <GridRow label="Vehicle" value={detail.vehicle ? `${detail.vehicle.vehicleNumber} — ${detail.vehicle.model}` : '—'} />
        <GridRow label="Scheduled" value={format(new Date(detail.scheduledAt), 'MMM d, yyyy HH:mm')} />
        {detail.startedAt && <GridRow label="Started" value={format(new Date(detail.startedAt), 'MMM d, yyyy HH:mm')} />}
        {detail.submittedAt && (
          <GridRow label="Submitted" value={format(new Date(detail.submittedAt), 'MMM d, yyyy HH:mm')} />
        )}
        {detail.reviewedAt && (
          <GridRow label="Reviewed / Closed" value={format(new Date(detail.reviewedAt), 'MMM d, yyyy HH:mm')} />
        )}
        {detail.completedAt && !detail.reviewedAt && (
          <GridRow label="Completed" value={format(new Date(detail.completedAt), 'MMM d, yyyy HH:mm')} />
        )}
        <GridRow label="Origin" value={formatLocation(detail.origin)} />
        <GridRow label="Destination" value={formatLocation(detail.destination)} />
        <GridRow label="Distance" value={formatDistance(detail.distance)} />
        <GridRow label="Est. Cost" value={formatCurrency(detail.estimatedCost)} />
        {(detail.status === TRIP_STATUS.REVIEWED || detail.status === TRIP_STATUS.COMPLETED) && (
          <>
            <GridRow label="Revenue" value={formatCurrency(detail.revenue)} bold />
            <GridRow label="Total Expenses" value={formatCurrency(detail.expenses)} />
            <GridRow
              label="Profit"
              value={formatCurrency(detail.profit ?? (detail.revenue || 0) - (detail.expenses || 0))}
              bold
            />
            {detail.reviewedBy?.name && <GridRow label="Reviewed By" value={detail.reviewedBy.name} />}
            {detail.reviewNotes && <GridRow label="Dispatcher Remarks" value={detail.reviewNotes} />}
          </>
        )}
        {!(detail.status === TRIP_STATUS.REVIEWED || detail.status === TRIP_STATUS.COMPLETED) && (
          <GridRow label="Driver Expenses" value={formatCurrency(expenseSummary?.total || detail.expenses)} bold />
        )}
        {detail.notes && <GridRow label="Trip Detail" value={detail.notes} />}

        {detail.consignment?.status && (
          <>
            <Divider sx={{ my: 2 }} />
            <Typography variant="subtitle2" fontWeight={700} mb={1}>
              Consignment
            </Typography>
            {detail.consignment.referenceNumber && (
              <GridRow label="Reference" value={detail.consignment.referenceNumber} />
            )}
            <Box display="flex" justifyContent="space-between" py={0.5}>
              <Typography variant="body2" color="text.secondary">
                Status
              </Typography>
              <Chip
                label={consignmentStatusLabels[detail.consignment.status]}
                size="small"
                color={consignmentStatusColors[detail.consignment.status] || 'default'}
              />
            </Box>
          </>
        )}

        {expenses.length > 0 && (
          <>
            <Divider sx={{ my: 2 }} />
            <Typography variant="subtitle2" fontWeight={700} mb={1}>
              Driver Expenses & Bills
            </Typography>
            <List dense disablePadding>
              {expenses.map((exp) => (
                <ListItem
                  key={exp.id}
                  sx={{ px: 0 }}
                  secondaryAction={
                    exp.receiptUrl ? (
                      <IconButton edge="end" onClick={() => window.open(resolveReceiptUrl(exp.receiptUrl), '_blank')}>
                        <ReceiptIcon fontSize="small" />
                      </IconButton>
                    ) : null
                  }
                >
                  <ListItemText
                    primary={`${formatCurrency(exp.amount)} — ${expenseCategoryLabels[exp.category]}`}
                    secondary={`${exp.vendor || exp.description || '—'} · ${format(new Date(exp.loggedAt), 'MMM d, HH:mm')}`}
                  />
                </ListItem>
              ))}
            </List>
          </>
        )}

        {(canUpdate || canDeletePerm) && (
          <Box display="flex" gap={1} mt={2} flexWrap="wrap">
            {canUpdate && canEdit(detail.status) && (
              <Button size="small" variant="outlined" onClick={() => onEdit(detail)}>
                Edit
              </Button>
            )}
            {canUpdate && canStart(detail.status) && (
              <Button
                size="small"
                variant="contained"
                startIcon={loadingAction ? <CircularProgress size={16} color="inherit" /> : <PlayArrowIcon />}
                onClick={() => onStart(detail.id)}
                disabled={loadingAction}
              >
                Start
              </Button>
            )}
            {canUpdate && canComplete(detail.status) && !canReviewPerm && (
              <Button
                size="small"
                variant="contained"
                color="success"
                startIcon={<CheckCircleIcon />}
                onClick={() => onComplete(detail)}
              >
                Complete
              </Button>
            )}
            {canReviewPerm && canReview(detail.status) && (
              <Button
                size="small"
                variant="contained"
                color="secondary"
                startIcon={<RateReviewIcon />}
                onClick={() => navigate(`/trip-review?trip=${detail.id}`)}
              >
                Review Trip
              </Button>
            )}
            {canUpdate && canCancel(detail.status) && (
              <Button size="small" variant="outlined" color="warning" startIcon={<CancelIcon />} onClick={() => onCancel(detail.id)}>
                Cancel
              </Button>
            )}
            {canDeletePerm && canDelete(detail.status) && (
              <Button size="small" variant="outlined" color="error" onClick={() => onDelete(detail.id)}>
                Delete
              </Button>
            )}
          </Box>
        )}

        <Divider sx={{ my: 2 }} />

        <Typography variant="subtitle2" fontWeight={700} mb={1}>
          History
        </Typography>
        {historyLoading ? (
          <CircularProgress size={24} />
        ) : (
          <List dense disablePadding>
            {history.map((h) => (
              <ListItem key={h.id} sx={{ px: 0 }}>
                <ListItemText
                  primary={h.description}
                  secondary={`${h.action} · ${format(new Date(h.createdAt), 'MMM d, HH:mm')}`}
                />
              </ListItem>
            ))}
          </List>
        )}
      </Box>
    </Drawer>
  );
};

const GridRow = ({ label, value, bold }) => (
  <Box display="flex" justifyContent="space-between" py={0.5}>
    <Typography variant="body2" color="text.secondary">
      {label}
    </Typography>
    <Typography variant="body2" fontWeight={bold ? 700 : 400} textAlign="right" maxWidth="60%">
      {value}
    </Typography>
  </Box>
);

export default TripDetailDrawer;
