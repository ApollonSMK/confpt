
import type { Metadata } from 'next';
import './globals.css';
import { MainNav } from '@/components/main-nav';
import { Footer } from '@/components/footer';
import { Toaster } from '@/components/ui/toaster';
import { createServerClient } from '@/lib/supabase/server';
import { PT_Sans, Playfair_Display, Uncial_Antiqua } from 'next/font/google';

export const metadata: Metadata = {
  title: 'Confrarias Portugal',
  description: 'Discover the gastronomic treasures of Portugal, curated by its brotherhoods.',
};

const pt_sans = PT_Sans({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-pt-sans',
});

const playfair_display = Playfair_Display({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-playfair-display',
});

const uncial_antiqua = Uncial_Antiqua({
  subsets: ['latin'],
  weight: ['400'],
  variable: '--font-uncial-antiqua',
});

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isAdmin = user?.email === process.env.ADMIN_EMAIL;

  return (
    <html lang="en" className={`${pt_sans.variable} ${playfair_display.variable} ${uncial_antiqua.variable} scroll-smooth`}>
      <body className="font-body antialiased bg-background text-foreground">
        <div className="flex flex-col min-h-screen">
          <MainNav user={user} isAdmin={isAdmin}/>
          <main className="flex-grow">{children}</main>
          <Footer />
        </div>
        <Toaster />
      </body>
    </html>
  );
}
