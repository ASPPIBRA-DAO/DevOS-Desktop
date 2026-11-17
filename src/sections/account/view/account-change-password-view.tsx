import React from 'react';

import { AccountLayout } from '../account-layout';
import {
  type SecuritySession,
  AccountChangePassword,
  type ChangePasswordHandler,
} from '../account-change-password';

// ----------------------------------------------------------------------

type Props = {
  onChangePassword?: ChangePasswordHandler;
  sessions?: SecuritySession[];
  onRevokeSession?: (sessionId: string) => Promise<void>;
  onConfigureBiometrics?: () => Promise<void>;
};

export function AccountChangePasswordView(props: Props) {
  return (
    <AccountLayout>
      <AccountChangePassword {...props} />
    </AccountLayout>
  );
}

export default AccountChangePasswordView;
