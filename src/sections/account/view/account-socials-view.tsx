import type { SocialLinks, SaveSocialLinks } from '../account-socials';

import React from 'react';

import { AccountLayout } from '../account-layout';
import { AccountSocials } from '../account-socials';

type Props = {
  socialLinks?: SocialLinks;
  onSave?: SaveSocialLinks;
};

export function AccountSocialsView({ socialLinks, onSave }: Props) {
  return (
    <AccountLayout>
      <AccountSocials socialLinks={socialLinks} onSave={onSave} />
    </AccountLayout>
  );
}

export default AccountSocialsView;
