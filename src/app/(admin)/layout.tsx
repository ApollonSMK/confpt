
import type { Metadata } from 'next';
import '../globals.css';
import { Toaster } from '@/components/ui/toaster';

export const metadata: Metadata = {
  title: 'Painel Administrativo - Confrarias Portugal',
  description: 'Área de gestão de conteúdo para o site Confrarias de Portugal.',
};

export default function AdminRootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  return (
    <>
        {children}
        <Toaster />
    </>
  );
}
