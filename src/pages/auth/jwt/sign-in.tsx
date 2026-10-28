import { CONFIG } from 'src/global-config';
import { JwtSignInView } from 'src/auth/view/jwt';

const metadata = { title: `Acesso ao Cofre | ${CONFIG.appName}` };

export default function SignInPage() {
  return (
    <>
      <title>{metadata.title}</title>
      <JwtSignInView />
    </>
  );
}
