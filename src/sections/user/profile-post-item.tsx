import React, { useState } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Avatar from '@mui/material/Avatar';
import Divider from '@mui/material/Divider';
import InputBase from '@mui/material/InputBase';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import AvatarGroup from '@mui/material/AvatarGroup';

import { Image } from 'src/shared/components/image';
import { Iconify } from 'src/shared/components/iconify';

import type { UserPostItem } from './types';

// ----------------------------------------------------------------------

type Props = {
  post: UserPostItem;
};

export function ProfilePostItem({ post }: Props) {
  const [likes, setLikes] = useState(post.likes);
  const [hasLiked, setHasLiked] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [comments, setComments] = useState(post.comments);

  const handleLike = () => {
    setLikes((prev) => (hasLiked ? prev - 1 : prev + 1));
    setHasLiked(!hasLiked);
  };

  const handleAddComment = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && commentText.trim()) {
      e.preventDefault();
      setComments([
        ...comments,
        {
          id: `c-${Date.now()}`,
          author: { name: 'Usuário' },
          createdAt: 'Agora',
          message: commentText.trim(),
        },
      ]);
      setCommentText('');
    }
  };

  return (
    <Card sx={{ p: 3, borderRadius: 2 }}>
      {/* Cabeçalho do Post */}
      <Stack direction="row" sx={{ mb: 2, alignItems: 'center', justifyContent: 'space-between' }}>
        <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
          <Avatar
            src={post.author.avatarUrl}
            alt={post.author.name}
            sx={{
              bgcolor: 'success.main',
              color: 'common.white',
              fontWeight: 700,
              width: 40,
              height: 40,
            }}
          >
            {post.author.name.charAt(0).toUpperCase()}
          </Avatar>

          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
              {post.author.name}
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500 }}>
              {post.createdAt}
            </Typography>
          </Box>
        </Stack>

        <IconButton size="small">
          <Iconify icon="eva:more-vertical-fill" />
        </IconButton>
      </Stack>

      {/* Mensagem */}
      <Typography variant="body2" sx={{ color: 'text.primary', mb: 2, lineHeight: 1.6 }}>
        {post.message}
      </Typography>

      {/* Mídia da Postagem */}
      {post.media && (
        <Box sx={{ borderRadius: 1.5, overflow: 'hidden', mb: 2 }}>
          <Image
            alt="Post media"
            src={post.media}
            ratio="16/9"
            sx={{ width: 1, borderRadius: 1.5 }}
          />
        </Box>
      )}

      {/* Barra de Reações */}
      <Stack
        direction="row"
        sx={{
          py: 1,
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
          <IconButton size="small" onClick={handleLike} sx={{ color: hasLiked ? 'error.main' : 'error.light' }}>
            <Iconify icon="solar:heart-bold" width={20} sx={{ color: 'error.main' }} />
          </IconButton>
          <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.primary', mr: 1 }}>
            {likes}
          </Typography>

          <AvatarGroup max={4} sx={{ '& .MuiAvatar-root': { width: 22, height: 22, fontSize: '0.65rem' } }}>
            <Avatar alt="User 1" src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" />
            <Avatar alt="User 2" src="https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka" />
            <Avatar alt="User 3" src="https://api.dicebear.com/7.x/avataaars/svg?seed=John" />
          </AvatarGroup>
        </Stack>

        <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
          <IconButton size="small">
            <Iconify icon="solar:chat-round-dots-bold" width={18} sx={{ color: 'text.secondary' }} />
          </IconButton>
          <IconButton size="small">
            <Iconify icon="solar:share-bold" width={18} sx={{ color: 'text.secondary' }} />
          </IconButton>
        </Stack>
      </Stack>

      {/* Lista de Comentários */}
      {comments.length > 0 && (
        <Stack spacing={1.5} sx={{ mt: 1.5, pt: 1.5, borderTop: (theme) => `1px solid ${theme.palette.divider}` }}>
          {comments.map((comment) => (
            <Stack key={comment.id} direction="row" spacing={1.5} sx={{ alignItems: 'flex-start' }}>
              <Avatar
                src={comment.author.avatarUrl}
                alt={comment.author.name}
                sx={{ width: 32, height: 32, fontSize: '0.75rem', fontWeight: 700, bgcolor: 'grey.300', color: 'grey.800' }}
              >
                {comment.author.name.charAt(0).toUpperCase()}
              </Avatar>

              <Box
                sx={{
                  flexGrow: 1,
                  p: 1.5,
                  borderRadius: 1.5,
                  bgcolor: (theme) => theme.palette.action.hover,
                }}
              >
                <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, fontSize: '0.8rem' }}>
                    {comment.author.name}
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: '0.7rem' }}>
                    {comment.createdAt}
                  </Typography>
                </Stack>
                <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.82rem', lineHeight: 1.5 }}>
                  {comment.message}
                </Typography>
              </Box>
            </Stack>
          ))}
        </Stack>
      )}

      {/* Input de Novo Comentário */}
      <Stack direction="row" spacing={1.5} sx={{ mt: 2, alignItems: 'center' }}>
        <Avatar
          sx={{
            width: 32,
            height: 32,
            fontSize: '0.75rem',
            fontWeight: 700,
            bgcolor: 'success.main',
            color: 'common.white',
          }}
        >
          U
        </Avatar>

        <Box
          sx={{
            flexGrow: 1,
            display: 'flex',
            alignItems: 'center',
            borderRadius: 1.5,
            border: (theme) => `1px solid ${theme.palette.divider}`,
            px: 1.5,
            py: 0.5,
          }}
        >
          <InputBase
            fullWidth
            placeholder="Write a comment..."
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            onKeyDown={handleAddComment}
            sx={{ fontSize: '0.85rem' }}
          />

          <IconButton size="small" sx={{ color: 'text.secondary' }}>
            <Iconify icon="solar:gallery-add-bold" width={18} />
          </IconButton>
          <IconButton size="small" sx={{ color: 'text.secondary' }}>
            <Iconify icon="solar:smile-circle-bold" width={18} />
          </IconButton>
        </Box>
      </Stack>
    </Card>
  );
}
