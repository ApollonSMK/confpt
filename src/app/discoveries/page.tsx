import { getDiscoveries } from '@/lib/data-server';
import { regions, discoveryTypes } from '@/lib/data';
import { DiscoveryFilter } from '@/components/discovery-filter';
import { DiscoveryCard } from '@/components/discovery-card';
import { createServerClient } from '@/lib/supabase/server';

export default async function DiscoveriesPage({
  searchParams,
}: {
  searchParams?: { [key: string]: string | string[] | undefined };
}) {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  let discoveries = await getDiscoveries(user?.id);
  const allDiscoveriesForFilter = await getDiscoveries();

  const searchTerm = searchParams?.search as string || '';
  const region = searchParams?.region as string || '';
  const type = searchParams?.type as string || '';

  if (searchTerm) {
    discoveries = discoveries.filter(d =>
      d.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.description.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }
  if (region) {
    discoveries = discoveries.filter(d => d.region === region);
  }
  if (type) {
    discoveries = discoveries.filter(d => d.type === type);
  }

  return (
    <div className="container mx-auto px-4 py-8 md:py-16">
      <h1 className="font-headline text-4xl md:text-5xl font-bold mb-4 text-center">Explorar Descobertas</h1>
      <p className="text-lg text-muted-foreground text-center mb-10 max-w-2xl mx-auto">
        Filtre por região, tipo ou palavra-chave para encontrar os tesouros escondidos de Portugal.
      </p>

      <DiscoveryFilter regions={regions} discoveryTypes={discoveryTypes} allDiscoveries={allDiscoveriesForFilter} />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {discoveries.map(discovery => (
          <DiscoveryCard key={discovery.id} discovery={discovery} />
        ))}
      </div>
      {discoveries.length === 0 && (
        <div className="text-center col-span-full py-16">
            <p className="text-muted-foreground text-lg">Nenhuma descoberta encontrada. Tente alargar os seus critérios de pesquisa.</p>
        </div>
      )}
    </div>
  );
}
