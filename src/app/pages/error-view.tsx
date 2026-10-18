import React from 'react';
import { m } from 'framer-motion';
import { useNavigate } from 'react-router';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';

import { CyberButton } from '../../shared/components/cyber-button';
import { Iconify } from '../../shared/components/iconify';
import { ServerErrorIllustration } from '../../shared/components/illustrations';
import { MotionContainer, varBounce } from '../../shared/components/animate';

// ----------------------------------------------------------------------

interface ErrorViewProps {
  error?: Error | null;
  resetErrorBoundary?: () => void;
}

export function ErrorView({ error, resetErrorBoundary }: ErrorViewProps) {
  const navigate = useNavigate();

  const handleReset = () => {
    if (resetErrorBoundary) {
      resetErrorBoundary();
    }
    navigate('/');
  };

  return (
    <Container
      component={MotionContainer}
      sx={{
        py: 6,
        display: 'flex',
        minHeight: '70vh',
        textAlign: 'center',
        alignItems: 'center',
        flexDirection: 'column',
        justifyContent: 'center',
      }}
    >
      <m.div variants={varBounce('in')}>
        <Typography variant="h3" sx={{ mb: 1.5, fontWeight: 700 }}>
          Erro Interno de Renderização
        </Typography>
      </m.div>

      <m.div variants={varBounce('in')}>
        <Typography sx={{ color: 'text.secondary', maxWidth: 520, mx: 'auto', mb: 2 }}>
          Ocorreu uma falha inesperada na interface desktop do DevOS.
          {error?.message ? ` Detalhe técnico: ${error.message}` : ''}
        </Typography>
      </m.div>

      <m.div variants={varBounce('in')}>
        <ServerErrorIllustration sx={{ my: { xs: 2, sm: 4 }, width: { xs: 240, sm: 320 } }} />
      </m.div>

      <m.div variants={varBounce('in')}>
        <Box sx={{ mt: 2, display: 'flex', gap: 2, justifyContent: 'center' }}>
          <CyberButton
            glowColor="primary"
            size="large"
            onClick={handleReset}
            startIcon={<Iconify icon="solar:restart-bold-duotone" />}
          >
            Recuperar Navegação
          </CyberButton>

          <Button
            variant="outlined"
            color="inherit"
            size="large"
            onClick={() => window.location.reload()}
            startIcon={<Iconify icon="solar:refresh-circle-bold-duotone" />}
          >
            Recarregar Janela
          </Button>
        </Box>
      </m.div>
    </Container>
  );
}
