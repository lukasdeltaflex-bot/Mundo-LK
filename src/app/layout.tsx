import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/presentation/context/AuthContext';
import { AppearanceProvider } from '@/presentation/context/AppearanceContext';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Mundo LK — Gestão Inteligente de Ofertas para Afiliados',
  description: 'Sistema Operacional e Assistente Pessoal Inteligente de Automação de Ofertas para Afiliados de Marketplaces.',
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className="dark">
      <body className={`${inter.className} bg-slate-950 text-slate-100 antialiased min-h-screen`}>
        <AuthProvider>
          <AppearanceProvider>
            {children}
          </AppearanceProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
