import { redirect } from 'next/navigation';

/**
 * /ofertas foi integrada ao Dashboard.
 * Esta rota agora redireciona permanentemente para /dashboard.
 */
export default function OfertasRedirectPage() {
  redirect('/dashboard');
}
