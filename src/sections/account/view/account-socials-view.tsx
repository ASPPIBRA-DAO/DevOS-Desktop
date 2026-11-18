import type { SocialLinks, SaveSocialLinks } from '../account-socials';

import React from 'react';

import { AccountLayout } from '../account-layout';
import { useAccountFacade } from '../use-account';
import { AccountSocials } from '../account-socials';

type Props = {
  socialLinks?: SocialLinks;
  onSave?: SaveSocialLinks;
};

export function AccountSocialsView({ socialLinks: propSocialLinks, onSave: propOnSave }: Props) {
  const { user, updateProfile } = useAccountFacade();

  const activeSocialLinks = propSocialLinks ?? user.socialLinks;
  const handleSave: SaveSocialLinks =
    propOnSave ??
    (async (links) => {
      await updateProfile({ socialLinks: links });
    });

  return (
    <AccountLayout>
      <AccountSocials socialLinks={activeSocialLinks} onSave={handleSave} />
    </AccountLayout>
  );
}

export default AccountSocialsView;
