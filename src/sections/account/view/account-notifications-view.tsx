import React from 'react';

import { AccountLayout } from '../account-layout';
import { AccountNotifications } from '../account-notifications';

export function AccountNotificationsView() {
  return (
    <AccountLayout>
      <AccountNotifications />
    </AccountLayout>
  );
}

export default AccountNotificationsView;
