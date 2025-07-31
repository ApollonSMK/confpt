

import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowRight, Grape } from 'lucide-react';
import { createServerClient } from '@/lib/supabase/server';
import type { Discovery } from '@/lib/data';
import { FeaturedCarousel } from '@/components/featured-carousel';


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
        .order('id');

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
        const images = d.discovery_images.map((img: any) => ({
            imageUrl: img.image_url,
            imageHint: img.image_hint,
        }));
        
        return {
            ...d,
            type: d.discovery_types.name,
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


export default async function Home() {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  const allDiscoveries = await getDiscoveries(user?.id);
  const featuredDiscoveries = allDiscoveries.slice(0, 6);

  return (
    <div className="container mx-auto px-4 py-8 md:py-16">
      <section className="text-center mb-16 md:mb-24">
        <div className="inline-block p-4 mb-4 bg-primary/10 rounded-full">
          <Grape className="w-10 h-10 text-primary" />
        </div>
        <h1 className="font-headline text-4xl md:text-6xl font-bold text-primary mb-4">
          Confrarias Gastronómicas
        </h1>
        <div className="text-lg md:text-xl max-w-3xl mx-auto text-muted-foreground mb-8 space-y-4">
            <p className="font-headline italic text-2xl">
                &quot;Aqui não se navega. Aqui degusta-se cada descoberta.&quot;
            </p>
            <p>
                Uma plataforma editorial onde cada entrada representa uma descoberta viva, uma história partilhada com a confiança das antigas confrarias portuguesas.
            </p>
        </div>
        <div className="flex justify-center gap-4">
          <Button asChild size="lg">
            <Link href="/discoveries">
              Explorar Descobertas <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
          <Button asChild size="lg" variant="secondary">
            <Link href="/confrarias">Conhecer as Confrarias</Link>
          </Button>
        </div>
      </section>

      <section>
        <h2 className="font-headline text-3xl md:text-4xl font-bold mb-8 text-center">
          Destaques
        </h2>
        <FeaturedCarousel discoveries={featuredDiscoveries} />
      </section>
    </div>
  );
}
