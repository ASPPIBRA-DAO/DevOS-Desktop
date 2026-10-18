import React from 'react';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

import { Card } from './Card';
import { colors } from '../theme/palette';

interface MetricBoxProps {
  label: string;
  value: string | number;
  subtext?: string;
  icon?: React.ReactNode;
  accentColor?: string;
}

export function MetricBox({
  label,
  value,
  subtext,
  icon,
  accentColor = colors.primary.main,
}: MetricBoxProps) {
  return (
    <Card variant="glass">
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 1 }}>
        <Typography variant="caption" sx={{ color: colors.text.secondary, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>
          {label}
        </Typography>
        {icon && (
          <Box sx={{ color: accentColor, opacity: 0.85, display: 'flex', alignItems: 'center' }}>
            {icon}
          </Box>
        )}
      </Box>

      <Typography variant="h4" sx={{ fontWeight: 700, color: colors.text.primary, mb: 0.5 }}>
        {value}
      </Typography>

      {subtext && (
        <Typography variant="caption" sx={{ color: colors.text.secondary, fontSize: '0.75rem' }}>
          {subtext}
        </Typography>
      )}
    </Card>
  );
}
