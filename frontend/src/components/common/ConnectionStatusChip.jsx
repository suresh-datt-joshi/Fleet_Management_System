import { useEffect, useState } from 'react';
import { Chip, Tooltip } from '@mui/material';
import CircleIcon from '@mui/icons-material/Circle';
import { subscribeConnectionState } from '../../services/socketManager';

const stateConfig = {
  connected: { label: 'Live', color: 'success' },
  connecting: { label: 'Connecting', color: 'warning' },
  disconnected: { label: 'Offline', color: 'default' },
  error: { label: 'Reconnecting', color: 'warning' },
};

const ConnectionStatusChip = () => {
  const [state, setState] = useState('disconnected');

  useEffect(() => subscribeConnectionState(setState), []);

  const config = stateConfig[state] || stateConfig.disconnected;

  return (
    <Tooltip title={`Real-time connection: ${config.label}`}>
      <Chip
        icon={<CircleIcon sx={{ fontSize: '10px !important' }} />}
        label={config.label}
        size="small"
        color={config.color}
        variant="outlined"
        sx={{ mr: 1 }}
      />
    </Tooltip>
  );
};

export default ConnectionStatusChip;
