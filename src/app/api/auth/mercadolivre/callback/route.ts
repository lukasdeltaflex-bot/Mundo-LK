import { NextRequest, NextResponse } from 'next/server';
import { MercadoLivreProvider } from '@/infrastructure/marketplaces/providers/MercadoLivreProvider';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');

  if (!code) {
    return NextResponse.json({ error: 'Código de autorização OAuth ausente.' }, { status: 400 });
  }

  try {
    const mlProvider = new MercadoLivreProvider();
    const tokenData = await mlProvider.exchangeCodeForToken(code);

    console.log(`[MercadoLivre OAuth Callback] Token gerado para user_id ${tokenData.user_id}`);

    // Redireciona para o dashboard com status de sucesso na conexão
    const redirectUrl = new URL('/operacao', request.url);
    redirectUrl.searchParams.set('ml_status', 'connected');
    return NextResponse.redirect(redirectUrl);
  } catch (err: any) {
    console.error('[MercadoLivre OAuth Callback Error]:', err?.message || err);
    const redirectUrl = new URL('/operacao', request.url);
    redirectUrl.searchParams.set('ml_status', 'error');
    redirectUrl.searchParams.set('error_msg', encodeURIComponent(err?.message || 'Falha na autenticação OAuth'));
    return NextResponse.redirect(redirectUrl);
  }
}
