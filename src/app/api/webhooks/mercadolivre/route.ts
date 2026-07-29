import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();
    console.log('[MercadoLivre Webhook Received]:', JSON.stringify(payload));

    // O Mercado Livre exige resposta rápida 200 OK
    return NextResponse.json({ status: 'OK', receivedAt: new Date().toISOString() }, { status: 200 });
  } catch (err: any) {
    console.warn('[MercadoLivre Webhook Error]:', err?.message || err);
    return NextResponse.json({ status: 'OK' }, { status: 200 });
  }
}

export async function GET() {
  return NextResponse.json({ status: 'ACTIVE', endpoint: 'Mercado Livre Webhook Listener' }, { status: 200 });
}
