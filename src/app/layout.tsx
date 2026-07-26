import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'AffiliateOS V4',
  description: 'Assistente Operacional Pessoal de Alta Produtividade para Afiliados',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className="antialiased">{children}</body>
    </html>
  );
}
