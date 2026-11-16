import React, { useState } from 'react';

import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import InputBase from '@mui/material/InputBase';

import { Iconify } from 'src/shared/components/iconify';

// ----------------------------------------------------------------------

type Props = {
  onPost?: (content: string) => void;
};

export function ProfilePostInput({ onPost }: Props) {
  const [content, setContent] = useState('');

  const handlePost = () => {
    if (content.trim()) {
      onPost?.(content);
      setContent('');
    }
  };

  return (
    <Card sx={{ p: 2.5, borderRadius: 2 }}>
      <InputBase
        multiline
        fullWidth
        rows={3}
        placeholder="Share what you are thinking here..."
        value={content}
        onChange={(e) => setContent(e.target.value)}
        sx={{
          p: 1.5,
          borderRadius: 1.5,
          border: (theme) => `1px solid ${theme.palette.divider}`,
          fontSize: '0.9rem',
          mb: 2,
        }}
      />

      <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
        <Stack direction="row" spacing={1}>
          <Button
            size="small"
            color="inherit"
            startIcon={<Iconify icon="solar:camera-add-bold" width={18} sx={{ color: 'success.main' }} />}
            sx={{
              fontWeight: 600,
              bgcolor: (theme) => theme.palette.action.hover,
              px: 1.5,
              borderRadius: 1,
            }}
          >
            Image/Video
          </Button>

          <Button
            size="small"
            color="inherit"
            startIcon={<Iconify icon="solar:videocamera-record-bold" width={18} sx={{ color: 'error.main' }} />}
            sx={{
              fontWeight: 600,
              bgcolor: (theme) => theme.palette.action.hover,
              px: 1.5,
              borderRadius: 1,
            }}
          >
            Streaming
          </Button>
        </Stack>

        <Button
          size="small"
          variant="contained"
          color="inherit"
          onClick={handlePost}
          sx={{
            bgcolor: 'grey.900',
            color: 'common.white',
            fontWeight: 800,
            px: 2.5,
            borderRadius: 1,
            '&:hover': {
              bgcolor: 'grey.800',
            },
          }}
        >
          Post
        </Button>
      </Stack>
    </Card>
  );
}
