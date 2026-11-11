import type { PriorityAlert } from '../types/home';

import { useState } from 'react';

import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Collapse from '@mui/material/Collapse';
import AlertTitle from '@mui/material/AlertTitle';

import { RouterLink } from 'src/app/router/components/router-link';

type Props = {
  alerts: PriorityAlert[];
};

export function AppPriorityAlerts({ alerts }: Props) {
  const [openAlerts, setOpenAlerts] = useState<Record<string, boolean>>(
    alerts.reduce((acc, alert) => ({ ...acc, [alert.id]: true }), {})
  );

  const handleClose = (id: string) => {
    setOpenAlerts((prev) => ({ ...prev, [id]: false }));
  };

  if (!alerts.length) return null;

  return (
    <Stack spacing={1.5}>
      {alerts.map((alert) => (
        <Collapse key={alert.id} in={openAlerts[alert.id]}>
          <Alert
            severity={alert.type === 'urgente' ? 'error' : 'warning'}
            onClose={alert.isDismissible ? () => handleClose(alert.id) : undefined}
            action={
              alert.actionText && (
                <Button
                  component={alert.actionUrl ? RouterLink : 'button'}
                  href={alert.actionUrl}
                  onClick={alert.actionHandler}
                  color="inherit"
                  size="small"
                  variant="outlined"
                  sx={{ borderColor: 'currentColor', minWidth: 'auto', px: 1.5 }}
                >
                  {alert.actionText}
                </Button>
              )
            }
            sx={{
              borderRadius: 1.5,
              '& .MuiAlert-message': { width: 1 },
              '& .MuiAlert-action': { alignItems: 'center' },
            }}
          >
            <AlertTitle sx={{ fontWeight: 'bold', mb: 0.25 }}>{alert.title}</AlertTitle>
            <Box component="span" sx={{ typography: 'body2' }}>
              {alert.message}
            </Box>
          </Alert>
        </Collapse>
      ))}
    </Stack>
  );
}

