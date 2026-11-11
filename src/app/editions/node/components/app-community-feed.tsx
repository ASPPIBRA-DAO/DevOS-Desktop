import type { CommunityFeedPost } from '../types/home';

import { useState } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';

import { Image } from 'src/shared/components/image';
import { Iconify } from 'src/shared/components/iconify';

import { fToNow } from '../utils/format-time';

type Props = {
  posts: CommunityFeedPost[];
};

export function AppCommunityFeed({ posts }: Props) {
  return (
    <Stack spacing={2.5}>
      {posts.map((post) => (
        <FeedPostCard key={post.id} post={post} />
      ))}
    </Stack>
  );
}

function FeedPostCard({ post }: { post: CommunityFeedPost }) {
  const [likes, setLikes] = useState(post.likesCount);
  const [hasLiked, setHasLiked] = useState(false);

  const handleLike = () => {
    setLikes((prev) => (hasLiked ? prev - 1 : prev + 1));
    setHasLiked(!hasLiked);
  };

  return (
    <Card sx={{ p: 2.5, borderRadius: 2 }}>
      {/* Cabeçalho do Post */}
      <Stack direction="row" sx={{ mb: 2, alignItems: 'center', justifyContent: 'space-between' }}>
        <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
          <Avatar src={post.author.avatarUrl} alt={post.author.name}>
            {post.author.name.charAt(0)}
          </Avatar>
          <Box>
            <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                {post.author.name}
              </Typography>
              {post.author.badge && (
                <Chip
                  label={post.author.badge}
                  size="small"
                  variant="outlined"
                  color="primary"
                  sx={{ height: 20, fontSize: '0.65rem', fontWeight: 'bold' }}
                />
              )}
            </Stack>
            <Typography variant="caption" sx={{ color: 'text.disabled' }}>
              {post.author.role} • {fToNow(post.publishedAt)}
            </Typography>
          </Box>
        </Stack>

        <IconButton size="small">
          <Iconify icon="eva:more-vertical-fill" />
        </IconButton>
      </Stack>

      {/* Conteúdo */}
      <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
        {post.content}
      </Typography>

      {/* Mídia Opcional */}
      {post.mediaUrl && (
        <Box sx={{ borderRadius: 1.5, overflow: 'hidden', mb: 2, maxHeight: 320 }}>
          <Image alt="Post media" src={post.mediaUrl} sx={{ width: 1, height: 'auto' }} />
        </Box>
      )}

      {/* Ações / Reações */}
      <Stack
        direction="row"
        sx={{
          pt: 1.5,
          alignItems: 'center',
          justifyContent: 'space-between',
          borderTop: (theme) => `1px solid ${theme.palette.divider}`,
        }}
      >
        <Stack direction="row" spacing={1}>
          <Button
            size="small"
            color={hasLiked ? 'error' : 'inherit'}
            startIcon={<Iconify icon={hasLiked ? 'solar:heart-bold' : 'solar:heart-outline'} />}
            onClick={handleLike}
          >
            {likes}
          </Button>

          <Button
            size="small"
            color="inherit"
            startIcon={<Iconify icon="solar:chat-round-dots-outline" />}
          >
            {post.commentsCount}
          </Button>

          <Button
            size="small"
            color="inherit"
            startIcon={<Iconify icon="solar:share-outline" />}
          >
            {post.sharesCount}
          </Button>
        </Stack>

        <Button size="small" color="primary" variant="text">
          Ver Detalhes
        </Button>
      </Stack>
    </Card>
  );
}
