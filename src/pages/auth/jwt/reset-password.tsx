import { CONFIG } from 'src/global-config';
import { JwtResetPasswordView } from 'src/auth/view/jwt';

const metadata = { title: `Recuperar Acesso | ${CONFIG.appName}` };

export default function ResetPasswordPage() {
  return (
    <>
      <title>{metadata.title}</title>
      <JwtResetPasswordView />
    </>
  );
}
