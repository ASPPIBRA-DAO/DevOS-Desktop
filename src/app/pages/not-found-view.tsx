import React from 'react';
import { m } from 'framer-motion';
import { useNavigate } from 'react-router';

import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';

import { Iconify } from '../../shared/components/iconify';
import { CyberButton } from '../../shared/components/cyber-button';
import { varBounce, MotionContainer } from '../../shared/components/animate';
import { PageNotFoundIllustration } from '../../shared/components/illustrations';

// ----------------------------------------------------------------------

export function NotFoundView() {
  const navigate = useNavigate();

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
          Página Não Encontrada
        </Typography>
      </m.div>

      <m.div variants={varBounce('in')}>
        <Typography sx={{ color: 'text.secondary', maxWidth: 480, mx: 'auto', mb: 3 }}>
          O recurso ou rota solicitada não existe ou foi movida na estrutura do sistema.
          Verifique a navegação no menu lateral.
        </Typography>
      </m.div>

      <m.div variants={varBounce('in')}>
        <PageNotFoundIllustration sx={{ my: { xs: 2, sm: 4 }, width: { xs: 240, sm: 320 } }} />
      </m.div>

      <m.div variants={varBounce('in')}>
        <Box sx={{ mt: 2 }}>
          <CyberButton
            glowColor="primary"
            size="large"
            onClick={() => navigate('/')}
            startIcon={<Iconify icon="solar:home-2-bold-duotone" />}
          >
            Voltar ao Painel Principal
          </CyberButton>
        </Box>
      </m.div>
    </Container>
  );
}
