import { Grape, MapPin, Mail } from 'lucide-react';
import Link from 'next/link';
import { createServerClient } from '@/lib/supabase/server';
import type { Confraria } from '@/lib/data';

async function getRecentConfrarias(): Promise<Confraria[]> {
    const supabase = createServerClient();
    const { data, error } = await supabase
        .from('confrarias')
        .select('id, name')
        .order('id', { ascending: false })
        .limit(5);

    if (error) {
        console.error('Error fetching recent confrarias for footer:', error);
        return [];
    }
    return data;
}

const navLinks = [
  { href: '/', label: 'Início' },
  { href: '/discoveries', label: 'Descobertas' },
  { href: '/confrarias', label: 'Confrarias' },
  { href: '/profile', label: 'Painel do Confrade' },
];

export async function Footer() {
  const year = new Date().getFullYear();
  const recentConfrarias = await getRecentConfrarias();

  return (
    <footer className="bg-primary text-primary-foreground/90">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          
          <div className="md:col-span-2 lg:col-span-2">
            <div className="flex items-center space-x-3 mb-4">
              <div className="bg-primary-foreground/10 p-2 rounded-full">
                <Grape className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h3 className="font-headline text-xl font-bold text-primary-foreground">Confrarias Portugal</h3>
                <p className="text-sm text-primary-foreground/80">Tradição e Sabor</p>
              </div>
            </div>
            <p className="text-sm mb-4 max-w-md">
              Uma plataforma editorial dedicada às tradições gastronómicas portuguesas, onde cada descoberta é partilhada com a confiança e o carinho das antigas confrarias.
            </p>
            <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4 text-sm">
                <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4"/>
                    <span>Portugal</span>
                </div>
                <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4"/>
                    <a href="mailto:geral@confrariasportugal.pt" className="hover:text-primary-foreground transition-colors">geral@confrariasportugal.pt</a>
                </div>
            </div>
          </div>
          
          <div>
            <h4 className="font-headline text-lg font-semibold mb-4 text-primary-foreground">Confrarias</h4>
            <ul className="space-y-2">
              {recentConfrarias.map(c => (
                <li key={c.id}>
                  <Link href={`/confrarias/${c.id}`} className="text-sm hover:text-primary-foreground transition-colors">
                    {c.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-headline text-lg font-semibold mb-4 text-primary-foreground">Navegação</h4>
             <ul className="space-y-2">
                {navLinks.map(link => (
                    <li key={link.href}>
                        <Link href={link.href} className="text-sm hover:text-primary-foreground transition-colors">
                            {link.label}
                        </Link>
                    </li>
                ))}
            </ul>
          </div>
        </div>
        
        <div className="border-t border-primary-foreground/20 pt-6 flex flex-col md:flex-row justify-between items-center text-sm">
          <p className="text-primary-foreground/80 mb-4 md:mb-0">
            &copy; {year} Confrarias.pt. Todos os direitos reservados.
          </p>
          <p className="italic text-primary-foreground/80 text-center md:text-right">
            &quot;Aqui não se navega. Aqui degusta-se cada descoberta.&quot;
          </p>
        </div>
      </div>
    </footer>
  );
}
