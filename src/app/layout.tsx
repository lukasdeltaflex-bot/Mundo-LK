import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/presentation/context/AuthContext';
import { AppearanceProvider } from '@/presentation/context/AppearanceContext';
import { MenuOrderProvider } from '@/presentation/context/MenuOrderContext';
import { NotificationProvider } from '@/presentation/context/NotificationContext';

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
            <MenuOrderProvider>
              <NotificationProvider>
                {children}
              </NotificationProvider>
            </MenuOrderProvider>
          </AppearanceProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
