import { NextRequest, NextResponse } from 'next/server';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '@/infrastructure/firebase/config/firebase.config';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url, offerId } = body || {};

    if (!url || typeof url !== 'string' || (!url.startsWith('http://') && !url.startsWith('https://'))) {
      return NextResponse.json(
        { error: 'A URL informada deve ser um link HTTP ou HTTPS válido.' },
        { status: 400 }
      );
    }

    const trimmedUrl = url.trim();

    // Se já for uma URL do Firebase Storage, não faz novo espelhamento
    if (trimmedUrl.includes('firebasestorage.googleapis.com')) {
      return NextResponse.json({
        success: true,
        url: trimmedUrl,
        isAlreadyMirrored: true,
      });
    }

    // 1. Download Server-Side com cabeçalhos de navegador
    const res = await fetch(trimmedUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept: 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
        'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
      },
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: `Não foi possível baixar a imagem da URL informada (Status HTTP ${res.status}).` },
        { status: 400 }
      );
    }

    const contentType = (res.headers.get('content-type') || '').toLowerCase();
    const isImageContent = contentType.includes('image/') || contentType.includes('application/octet-stream');

    if (!isImageContent) {
      return NextResponse.json(
        { error: `O link fornecido não retornou uma imagem válida (Content-Type: ${contentType || 'desconhecido'}).` },
        { status: 415 }
      );
    }

    const buffer = await res.arrayBuffer();
    const MAX_SIZE = 15 * 1024 * 1024; // 15MB

    if (buffer.byteLength > MAX_SIZE) {
      return NextResponse.json(
        { error: 'A imagem excede o tamanho máximo permitido de 15MB.' },
        { status: 400 }
      );
    }

    // 2. Determina extensão adequada do arquivo
    let ext = 'jpg';
    if (contentType.includes('png')) ext = 'png';
    else if (contentType.includes('webp')) ext = 'webp';
    else if (contentType.includes('gif')) ext = 'gif';
    else if (contentType.includes('avif')) ext = 'avif';

    const safeOfferId = offerId ? String(offerId).replace(/[^a-zA-Z0-9_-]/g, '_') : 'ready_offers';
    const filename = `ext_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${ext}`;
    const storagePath = `offers/${safeOfferId}/media/${filename}`;

    const storageRef = ref(storage, storagePath);

    // 3. Upload Server-Side para o Firebase Storage
    const snapshot = await uploadBytes(storageRef, new Uint8Array(buffer), {
      contentType: contentType.includes('image/') ? contentType : `image/${ext}`,
    });

    // 4. Obtenção da URL Permanente do Firebase Storage
    const permanentUrl = await getDownloadURL(snapshot.ref);

    console.log('[api/mirror-image] Imagem espelhada com sucesso no Storage:', permanentUrl);

    return NextResponse.json({
      success: true,
      url: permanentUrl,
      originalUrl: trimmedUrl,
    });
  } catch (err: any) {
    console.error('[api/mirror-image error]:', err?.message || err);
    return NextResponse.json(
      { error: err?.message || 'Erro interno ao espelhar a imagem no Firebase Storage.' },
      { status: 500 }
    );
  }
}
