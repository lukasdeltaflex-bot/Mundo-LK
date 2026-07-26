import { redirect } from 'next/navigation';

/**
 * /operacao foi integrada ao Dashboard.
 * Esta rota redireciona para /dashboard.
 */
export default function OperacaoRedirectPage() {
  redirect('/dashboard');
}
