

import { Discovery, DiscoveryType, districts } from '@/lib/data';
import { DiscoveryFilter } from '@/components/discovery-filter';
import { DiscoveryCard } from '@/components/discovery-card';
import { createServerClient } from '@/lib/supabase/server';
import { Button } from '@/components/ui/button';
import { Filter } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { createServiceRoleClient } from '@/lib/supabase/service';


async function getDiscoveries(user_id?: string): Promise<Discovery[]> {
    const supabase = createServerClient();
    const { data, error } = await supabase
        .from('discoveries')
        .select(`
            *,
            confrarias (
                id,
                name,
                seal_url,
                seal_hint
            ),
             discovery_images (
                image_url,
                image_hint
            ),
            discovery_seal_counts (
                seal_count
            ),
            discovery_types (
                name
            )
        `)
        .order('id', { ascending: false });

    if (error) {
        console.error('Error fetching discoveries:', JSON.stringify(error, null, 2));
        return [];
    }

    let userSeals = new Set<number>();
    if (user_id) {
        const { data: sealsData } = await supabase.from('seals').select('discovery_id').eq('user_id', user_id);
        if (sealsData) {
            userSeals = new Set(sealsData.map(s => s.discovery_id));
        }
    }
    
    return data.map((d: any) => {
      const images = (d.discovery_images || []).map((img: any) => ({
          imageUrl: img.image_url,
          imageHint: img.image_hint,
      }));

      return {
          ...d,
          type: d.discovery_types.name, // Extract the name from the related table
          confrariaId: d.confraria_id,
          imageUrl: images[0]?.imageUrl || 'https://placehold.co/600x400.png',
          imageHint: images[0]?.imageHint || 'placeholder',
          images: images,
          contextualData: {
              address: d.address,
              website: d.website,
              phone: d.phone
          },
          confrarias: d.confrarias ? { ...d.confrarias, sealUrl: d.confrarias.seal_url, sealHint: d.confrarias.seal_hint } : undefined,
          seal_count: d.discovery_seal_counts[0]?.seal_count || 0,
          user_has_sealed: userSeals.has(d.id),
      };
    }) as unknown as Discovery[];
}

async function getDiscoveryTypes(): Promise<DiscoveryType[]> {
    const supabase = createServiceRoleClient(); // Use service role to bypass RLS for this internal data
    const { data, error } = await supabase.from('discovery_types').select('*').order('name');
    if (error) {
        console.error("Error fetching discovery types for filter:", error);
        return [];
    }
    return data as DiscoveryType[];
}


export default async function DiscoveriesPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  const [allDiscoveries, discoveryTypes] = await Promise.all([
    getDiscoveries(user?.id),
    getDiscoveryTypes()
  ]);
  
  const searchTerm = searchParams?.search as string || '';
  const district = searchParams?.district as string || '';
  const type = searchParams?.type as string || '';

  let filteredDiscoveries = allDiscoveries;

  if (searchTerm) {
    filteredDiscoveries = filteredDiscoveries.filter(d =>
      d.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.description.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }
  if (district) {
    filteredDiscoveries = filteredDiscoveries.filter(d => d.district === district);
  }
  if (type) {
    filteredDiscoveries = filteredDiscoveries.filter(d => d.type === type);
  }

  const FilterComponent = () => (
    <DiscoveryFilter districts={districts} discoveryTypes={discoveryTypes} allDiscoveries={allDiscoveries} />
  );

  return (
    <div className="container mx-auto px-4 py-8 md:py-16">
      <div className="text-center mb-10">
        <h1 className="font-headline text-4xl md:text-5xl font-bold mb-4">Explorar Descobertas</h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Use os filtros para encontrar os tesouros escondidos de Portugal.
        </p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-4 lg:gap-8">
        {/* Sidebar para desktop */}
        <aside className="hidden lg:block lg:col-span-1">
          <div className="sticky top-24">
            <FilterComponent />
          </div>
        </aside>

        {/* Conteúdo principal */}
        <main className="lg:col-span-3">
          <div className="flex justify-between items-center mb-6">
            <span className="text-sm text-muted-foreground">
              {filteredDiscoveries.length} {filteredDiscoveries.length === 1 ? 'descoberta encontrada' : 'descobertas encontradas'}
            </span>
            {/* Botão para mobile */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" className="lg:hidden">
                  <Filter className="mr-2 h-4 w-4" /> Filtros
                </Button>
              </SheetTrigger>
              <SheetContent side="left">
                <FilterComponent />
              </SheetContent>
            </Sheet>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
            {filteredDiscoveries.map(discovery => (
              <DiscoveryCard key={discovery.id} discovery={discovery} />
            ))}
          </div>

          {filteredDiscoveries.length === 0 && (
            <div className="text-center col-span-full py-16 bg-card rounded-lg">
                <p className="text-muted-foreground text-lg font-semibold">Nenhuma descoberta encontrada.</p>
                <p className="text-muted-foreground mt-2">Tente alargar os seus critérios de pesquisa.</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
