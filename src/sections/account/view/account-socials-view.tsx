import type { SocialLinks, SaveSocialLinks } from '../account-socials';

import React from 'react';

import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';

import { AccountLayout } from '../account-layout';
import { useAccountFacade } from '../use-account';
import { AccountSocials } from '../account-socials';

type Props = {
  socialLinks?: SocialLinks | null;
  onSave?: SaveSocialLinks;
};

export function AccountSocialsView({ socialLinks: propSocialLinks, onSave: propOnSave }: Props) {
  const {
    user,
    updateProfile,
    loadStatus,
    isLoading,
    isVaultLocked,
    isSaving,
    migrationStatus,
    error,
  } = useAccountFacade();

  const activeSocialLinks = propSocialLinks ?? user.socialLinks;
  const handleSave: SaveSocialLinks =
    propOnSave ??
    (async (links) => {
      await updateProfile({ socialLinks: links });
    });

  const canSave =
    Boolean(propOnSave) ||
    (loadStatus === 'ready' &&
      !isLoading &&
      !isVaultLocked &&
      !isSaving &&
      migrationStatus !== 'conflict' &&
      migrationStatus !== 'error');

  return (
    <AccountLayout>
      <Stack spacing={2} sx={{ mb: 2 }}>
        {isVaultLocked && (
          <Alert severity="warning">
            O cofre seguro está bloqueado. Desbloqueie com sua senha mestre para alterar seus dados cadastrais.
          </Alert>
        )}

        {migrationStatus === 'conflict' && (
          <Alert severity="warning">
            Existe um conflito de reconciliação de dados entre o cofre e o ambiente anterior.
          </Alert>
        )}

        {error && <Alert severity="error">{error}</Alert>}
      </Stack>

      <AccountSocials
        socialLinks={activeSocialLinks}
        onSave={handleSave}
        canSave={canSave}
      />
    </AccountLayout>
  );
}

export default AccountSocialsView;
