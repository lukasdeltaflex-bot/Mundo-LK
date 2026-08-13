import React from 'react';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { FirestoreOfferRepository } from '@/infrastructure/firebase/repositories/firestore-offer.repository';
import { FirestoreProductRepository } from '@/infrastructure/firebase/repositories/firestore-product.repository';

interface SharePageProps {
  params: Promise<{
    offerId: string;
  }>;
}

/**
 * Função utilitária para carregar Offer e Product no servidor de forma reutilizável.
 */
async function loadOfferAndProduct(offerId: string) {
  if (!offerId || typeof offerId !== 'string' || offerId.length < 3) {
    return null;
  }

  try {
    const offerRepo = new FirestoreOfferRepository();
    const productRepo = new FirestoreProductRepository();

    // Busca a oferta pelo ID
    const offer = await offerRepo.findById(offerId);
    if (!offer) {
      return null;
    }

    // Busca o produto associado
    const product = await productRepo.findById(offer.productId);
    if (!product) {
      return null;
    }

    // Resolve a URL de afiliado imutável
    const rawAffiliateUrl = product.affiliateUrl ? product.affiliateUrl.url : product.originalUrl;
    if (!rawAffiliateUrl || !rawAffiliateUrl.startsWith('http')) {
      return null;
    }

    return {
      offer,
      product,
      affiliateUrl: rawAffiliateUrl,
    };
  } catch (err) {
    console.warn(`[SharePage] Erro ao carregar oferta ${offerId}:`, err);
    return null;
  }
}

/**
 * Gerador de Metadados OpenGraph & Twitter Cards do Next.js App Router.
 * Servido diretamente via HTML server-side para crawlers do WhatsApp/Telegram.
 */
export async function generateMetadata({ params }: SharePageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const data = await loadOfferAndProduct(resolvedParams.offerId);

  if (!data) {
    return {
      title: 'Oferta Não Encontrada | Mundo LK',
      description: 'A oferta solicitada não foi encontrada ou expirou.',
    };
  }

  const { product, offer, affiliateUrl } = data;
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://mundo-lk.app';
  const shareUrl = `${baseUrl}/l/${offer.id}`;
  const mainImage = product.images && product.images.length > 0 ? product.images[0] : 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500';
  const priceFormatted = product.currentPrice ? `R$ ${product.currentPrice.amount.toFixed(2)}` : 'Preço Especial';
  const titleText = `🔥 ${product.title} - por apenas ${priceFormatted}`;
  const descriptionText = offer.scoreJustification || product.description || `Confira a oferta imperdível na ${product.marketplaceSlug.toUpperCase()} no Mundo LK!`;

  return {
    title: titleText,
    description: descriptionText,
    openGraph: {
      title: titleText,
      description: descriptionText,
      url: shareUrl,
      siteName: 'Mundo LK Enterprise',
      images: [
        {
          url: mainImage,
          width: 800,
          height: 600,
          alt: product.title,
        },
      ],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: titleText,
      description: descriptionText,
      images: [mainImage],
    },
    other: {
      'og:image:secure_url': mainImage,
    },
  };
}

/**
 * Página Server Component com HTML estático contendo OpenGraph meta tags
 * e redirecionamento seguro para a affiliateUrl oficial.
 */
export default async function ShareOfferPage({ params }: SharePageProps) {
  const resolvedParams = await params;
  const data = await loadOfferAndProduct(resolvedParams.offerId);

  if (!data) {
    notFound();
  }

  const { product, affiliateUrl } = data;

  return (
    <html lang="pt-BR">
      <head>
        <meta httpEquiv="refresh" content={`1;url=${affiliateUrl}`} />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                window.location.replace("${affiliateUrl}");
              } catch(e) {
                window.location.href = "${affiliateUrl}";
              }
            `,
          }}
        />
      </head>
      <body className="bg-slate-950 text-slate-100 min-h-screen flex items-center justify-center p-4 font-sans">
        <div className="max-w-md w-full rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-2xl text-center space-y-5 animate-in fade-in duration-300">
          <div className="flex justify-center">
            <div className="h-16 w-16 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center">
              <svg className="animate-spin h-8 w-8 text-blue-400" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            </div>
          </div>

          <div className="space-y-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-blue-400 rounded-full bg-blue-500/10 px-3 py-1 border border-blue-500/20">
              {product.marketplaceSlug}
            </span>
            <h1 className="text-base font-extrabold text-white line-clamp-2 leading-snug">
              {product.title}
            </h1>
            <p className="text-xs text-slate-400">
              Redirecionando você para a oferta oficial no marketplace...
            </p>
          </div>

          {product.images && product.images.length > 0 && (
            <div className="flex justify-center py-2">
              <img
                src={product.images[0]}
                alt={product.title}
                className="h-32 w-32 object-contain bg-slate-950 rounded-2xl p-2 border border-slate-800"
              />
            </div>
          )}

          <div className="pt-2">
            <a
              href={affiliateUrl}
              className="inline-flex items-center justify-center w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-600/30 transition"
            >
              Ir para a Oferta Agora
            </a>
          </div>
        </div>
      </body>
    </html>
  );
}
