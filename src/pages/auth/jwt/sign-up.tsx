import { CONFIG } from 'src/global-config';
import { JwtSignUpView } from 'src/auth/view/jwt';

const metadata = { title: `Criar Cofre Seguro | ${CONFIG.appName}` };

export default function SignUpPage() {
  return (
    <>
      <title>{metadata.title}</title>
      <JwtSignUpView />
    </>
  );
}
