import { useState } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Checkbox from '@mui/material/Checkbox';
import Typography from '@mui/material/Typography';
import CardHeader from '@mui/material/CardHeader';
import LinearProgress from '@mui/material/LinearProgress';
import FormControlLabel from '@mui/material/FormControlLabel';

export function AppOnboarding() {
  const [steps, setSteps] = useState([
    { id: 1, label: 'Inicializar Cofre Seguro de Chaves', completed: true },
    { id: 2, label: 'Criar Wallet Genesis do Holder', completed: false },
    { id: 3, label: 'Registrar Credencial Oficial de Membro', completed: false },
    { id: 4, label: 'Conectar Nó de Armazenamento IPFS', completed: false },
  ]);

  const handleToggle = (id: number) => {
    setSteps((prev) =>
      prev.map((step) => (step.id === id ? { ...step, completed: !step.completed } : step))
    );
  };

  const completedCount = steps.filter((s) => s.completed).length;
  const progressPercent = Math.round((completedCount / steps.length) * 100);

  return (
    <Card sx={{ borderRadius: 2 }}>
      <CardHeader
        title="Primeiros Passos na Rede ASPPIBRA"
        subheader="Cumpra os passos básicos para desbloquear recursos avançados do seu nó"
      />

      <Box sx={{ p: 3 }}>
        <Stack spacing={1} sx={{ mb: 2 }}>
          <Stack direction="row" sx={{ justifyContent: 'space-between' }}>
            <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 'medium' }}>
              Progresso de Ativação
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
              {completedCount}/{steps.length}
            </Typography>
          </Stack>
          <LinearProgress
            variant="determinate"
            value={progressPercent}
            color="primary"
            sx={{ height: 8, borderRadius: 1 }}
          />
        </Stack>

        <Stack spacing={1}>
          {steps.map((step) => (
            <FormControlLabel
              key={step.id}
              control={
                <Checkbox
                  checked={step.completed}
                  onChange={() => handleToggle(step.id)}
                  color="primary"
                />
              }
              label={
                <Typography
                  variant="body2"
                  sx={{
                    textDecoration: step.completed ? 'line-through' : 'none',
                    color: step.completed ? 'text.disabled' : 'text.primary',
                  }}
                >
                  {step.label}
                </Typography>
              }
            />
          ))}
        </Stack>
      </Box>
    </Card>
  );
}
