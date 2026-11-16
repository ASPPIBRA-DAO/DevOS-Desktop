import React from 'react';

import { AccountLayout } from '../account-layout';
import { AccountGeneral } from '../account-general';

export function AccountGeneralView() {
  return (
    <AccountLayout>
      <AccountGeneral />
    </AccountLayout>
  );
}

export default AccountGeneralView;
