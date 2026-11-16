import React from 'react';
import { useForm, Controller } from 'react-hook-form';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';

import { toast } from 'src/shared/components/snackbar';

// ----------------------------------------------------------------------

const NOTIFICATIONS = [
  {
    subheader: 'Canais de Notificação',
    caption: 'Selecione os canais através dos quais deseja receber alertas do sistema.',
    items: [
      { id: 'email_notifications', label: 'E-mail', desc: 'Receber relatórios e notificações críticas por e-mail.' },
      { id: 'sms_notifications', label: 'Mensagens SMS', desc: 'Alertas de segurança e códigos de autenticação via SMS.' },
      { id: 'whatsapp_notifications', label: 'WhatsApp', desc: 'Avisos da diretoria e comunicados do associado via WhatsApp.' },
      { id: 'push_notifications', label: 'Push no Navegador / Desktop', desc: 'Alertas em tempo real enquanto estiver utilizando a plataforma.' },
    ],
  },
  {
    subheader: 'Eventos e Atividades',
    caption: 'Defina para quais eventos específicos você quer ser avisado.',
    items: [
      { id: 'activity_comments', label: 'Comentários e Menções', desc: 'Quando alguém comentar em seus posts ou marcar seu usuário.' },
      { id: 'activity_transactions', label: 'Transações Financeiras', desc: 'Envios, recebimentos e assinaturas de transações bancárias.' },
      { id: 'security_alerts', label: 'Segurança da Conta', desc: 'Tentativas de login em novos dispositivos e trocas de credenciais.' },
    ],
  },
];

export function AccountNotifications() {
  const { control, handleSubmit } = useForm({
    defaultValues: {
      email_notifications: true,
      sms_notifications: false,
      whatsapp_notifications: true,
      push_notifications: true,
      activity_comments: true,
      activity_transactions: true,
      security_alerts: true,
    },
  });

  const onSubmit = handleSubmit(() => {
    toast.success('Preferências de notificação salvas com sucesso!');
  });

  return (
    <form onSubmit={onSubmit}>
      <Stack spacing={4} sx={{ width: 1 }}>
        {NOTIFICATIONS.map((section) => (
          <Card key={section.subheader} sx={{ p: 4, borderRadius: 2 }}>
            <Typography variant="h6" sx={{ mb: 0.5, fontWeight: 800 }}>
              {section.subheader}
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
              {section.caption}
            </Typography>

            <Stack spacing={2.5}>
              {section.items.map((item) => (
                <Stack
                  key={item.id}
                  direction="row"
                  sx={{ alignItems: 'center', justifyContent: 'space-between' }}
                >
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{item.label}</Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      {item.desc}
                    </Typography>
                  </Box>

                  <Controller
                    name={item.id as any}
                    control={control}
                    render={({ field }) => (
                      <Switch {...field} checked={field.value} color="primary" />
                    )}
                  />
                </Stack>
              ))}
            </Stack>
          </Card>
        ))}

        <Stack direction="row" sx={{ justifyContent: 'flex-end' }}>
          <Button type="submit" variant="contained" size="large" sx={{ px: 4, fontWeight: 800 }}>
            Salvar Preferências
          </Button>
        </Stack>
      </Stack>
    </form>
  );
}

export default AccountNotifications;
