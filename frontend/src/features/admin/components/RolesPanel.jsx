import { Card, CardContent, Typography, Grid, Chip, List, ListItem, ListItemText, Accordion, AccordionSummary, AccordionDetails } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { ROLE_LABELS } from '../../../constants';
import { roleColors } from '../utils/adminUtils';

const RolesPanel = ({ roles = [] }) => (
  <Grid container spacing={2}>
    {roles.map((role) => (
      <Grid item xs={12} key={role.role}>
        <Accordion defaultExpanded={role.role === 'fleet_manager'}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography fontWeight={600} sx={{ mr: 2 }}>
              {role.label || ROLE_LABELS[role.role]}
            </Typography>
            <Chip label={`${role.permissionCount} permissions`} size="small" color={roleColors[role.role] || 'default'} />
          </AccordionSummary>
          <AccordionDetails>
            <Grid container spacing={0.5}>
              {(role.permissions || []).map((perm) => (
                <Grid item key={perm}>
                  <Chip label={perm.replace(/_/g, ' ')} size="small" variant="outlined" sx={{ textTransform: 'capitalize' }} />
                </Grid>
              ))}
            </Grid>
          </AccordionDetails>
        </Accordion>
      </Grid>
    ))}
  </Grid>
);

export const AdminOverviewPanel = ({ stats }) => {
  if (!stats) return null;

  return (
    <Grid container spacing={2}>
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              Users by Role
            </Typography>
            <List dense>
              {(stats.users?.byRole || []).map((r) => (
                <ListItem key={r.role} sx={{ px: 0 }}>
                  <ListItemText primary={r.label} secondary={`${r.count} users`} />
                  <Chip label={r.role.replace('_', ' ')} size="small" color={roleColors[r.role] || 'default'} />
                </ListItem>
              ))}
            </List>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              Recent Logins
            </Typography>
            {(stats.recentLogins || []).length === 0 ? (
              <Typography color="text.secondary">No recent login activity</Typography>
            ) : (
              <List dense>
                {stats.recentLogins.map((u) => (
                  <ListItem key={u.id} sx={{ px: 0 }}>
                    <ListItemText primary={u.name} secondary={u.email} />
                    <Chip label={ROLE_LABELS[u.role] || u.role} size="small" variant="outlined" />
                  </ListItem>
                ))}
              </List>
            )}
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
};

export default RolesPanel;
