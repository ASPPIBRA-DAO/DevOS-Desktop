import React from 'react';

import { AccountLayout } from '../account-layout';
import { AccountChangePassword } from '../account-change-password';

export function AccountChangePasswordView() {
  return (
    <AccountLayout>
      <AccountChangePassword />
    </AccountLayout>
  );
}

export default AccountChangePasswordView;
