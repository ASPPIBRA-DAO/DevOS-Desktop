import { CONFIG } from 'src/global-config';
import { JwtUpdatePasswordView } from 'src/auth/view/jwt';

const metadata = { title: `Atualizar Senha | ${CONFIG.appName}` };

export default function UpdatePasswordPage() {
  return (
    <>
      <title>{metadata.title}</title>
      <JwtUpdatePasswordView />
    </>
  );
}
