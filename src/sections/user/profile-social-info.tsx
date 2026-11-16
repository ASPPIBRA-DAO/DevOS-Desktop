import type { UserProfileSocials } from './types';

import React from 'react';

import Link from '@mui/material/Link';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { Iconify } from 'src/shared/components/iconify';

// ----------------------------------------------------------------------

type Props = {
  socials: UserProfileSocials;
};

export function ProfileSocialInfo({ socials }: Props) {
  const socialList = [
    {
      name: 'Facebook',
      url: socials.facebook,
      icon: 'eva:facebook-fill',
      color: '#1877F2',
    },
    {
      name: 'Instagram',
      url: socials.instagram,
      icon: 'ant-design:instagram-filled',
      color: '#DF3E30',
    },
    {
      name: 'Linkedin',
      url: socials.linkedin,
      icon: 'eva:linkedin-fill',
      color: '#0A66C2',
    },
    {
      name: 'Twitter',
      url: socials.twitter,
      icon: 'ri:twitter-x-fill',
      color: '#000000',
    },
  ];

  return (
    <Card sx={{ p: 3, borderRadius: 2 }}>
      <Typography variant="h6" sx={{ mb: 2, fontWeight: 800 }}>
        Social
      </Typography>

      <Stack spacing={2}>
        {socialList.map((social) => {
          if (!social.url) return null;

          return (
            <Stack key={social.name} direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
              <Iconify icon={social.icon} width={20} sx={{ color: social.color, flexShrink: 0 }} />
              <Link
                href={social.url}
                target="_blank"
                rel="noopener noreferrer"
                variant="body2"
                color="inherit"
                underline="hover"
                sx={{
                  color: 'text.secondary',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  fontSize: '0.85rem',
                }}
              >
                {social.url}
              </Link>
            </Stack>
          );
        })}
      </Stack>
    </Card>
  );
}
