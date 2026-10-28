import { CONFIG } from 'src/global-config';
import { JwtVerifyView } from 'src/auth/view/jwt';

const metadata = { title: `Verificar E-mail | ${CONFIG.appName}` };

export default function VerifyPage() {
  return (
    <>
      <title>{metadata.title}</title>
      <JwtVerifyView />
    </>
  );
}
