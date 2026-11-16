import React from 'react';

import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';

import { ProfileAbout } from './profile-about';
import { ProfilePostItem } from './profile-post-item';
import { ProfilePostInput } from './profile-post-input';
import { ProfileFollowInfo } from './profile-follow-info';
import { ProfileSocialInfo } from './profile-social-info';
import { _userAbout, _userPosts, _userSocials, _userFollowers } from './_mock';

// ----------------------------------------------------------------------

export function ProfileHome() {
  return (
    <Grid container spacing={3}>
      {/* Coluna Esquerda: Métricas, Sobre e Redes Sociais */}
      <Grid size={{ xs: 12, md: 4 }}>
        <Stack spacing={3}>
          <ProfileFollowInfo
            follower={_userFollowers.follower}
            following={_userFollowers.following}
          />

          <ProfileAbout about={_userAbout} />

          <ProfileSocialInfo socials={_userSocials} />
        </Stack>
      </Grid>

      {/* Coluna Direita: Caixa de Post e Feed de Postagens */}
      <Grid size={{ xs: 12, md: 8 }}>
        <Stack spacing={3}>
          <ProfilePostInput />

          {_userPosts.map((post) => (
            <ProfilePostItem key={post.id} post={post} />
          ))}
        </Stack>
      </Grid>
    </Grid>
  );
}
