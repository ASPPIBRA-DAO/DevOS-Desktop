import React from 'react';

import { AccountTwoFA } from '../account-2fa';
import { AccountLayout } from '../account-layout';

export function AccountTwoFAView() {
  return (
    <AccountLayout>
      <AccountTwoFA />
    </AccountLayout>
  );
}

export default AccountTwoFAView;
