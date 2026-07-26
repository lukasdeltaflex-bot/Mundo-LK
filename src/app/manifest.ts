import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Mundo LK — Gestão Inteligente de Ofertas para Afiliados',
    short_name: 'Mundo LK',
    description: 'Sistema Operacional e Assistente Pessoal Inteligente de Ofertas para Afiliados de Marketplaces',
    start_url: '/',
    display: 'standalone',
    background_color: '#020617',
    theme_color: '#020617',
    icons: [
      {
        src: '/favicon.ico',
        sizes: 'any',
        type: 'image/x-icon',
      },
    ],
  };
}
