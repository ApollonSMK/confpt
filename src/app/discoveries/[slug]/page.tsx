

import Image from 'next/image';
import { notFound, redirect } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { DiscoveryCard } from '@/components/discovery-card';
import { MapPin, Tag, Globe, Phone, Award, Shield, MessageSquareQuote } from 'lucide-react';
import Link from 'next/link';
import { createServerClient } from '@/lib/supabase/server';
import { toggleSeal } from './actions';
import { Button } from '@/components/ui/button';
import type { Discovery, TestimonialWithUser, DiscoveryImage } from '@/lib/data';
import { DiscoveryTestimonials } from '@/components/discovery-testimonials';
import { createServiceRoleClient } from '@/lib/supabase/service';

type DiscoveryPageProps = {
  params: {
    slug: string;
  };
};

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
        .order('sort_order', { referencedTable: 'discovery_images', ascending: true });


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
            type: d.discovery_types.name,
            confrariaId: d.confraria_id,
            // Compatibility for DiscoveryCard
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

async function getTestimonials(discoveryId: number): Promise<TestimonialWithUser[]> {
    const supabase = createServiceRoleClient(); 
    
    // 1. Fetch testimonials for the discovery
    const { data: testimonialsData, error: testimonialsError } = await supabase
        .from('testimonials')
        .select('id, content, created_at, user_id')
        .eq('discovery_id', discoveryId)
        .order('created_at', { ascending: false });

    if (testimonialsError) {
        console.error('Error fetching testimonials:', testimonialsError);
        return [];
    }

    if (!testimonialsData || testimonialsData.length === 0) {
        return [];
    }

    // 2. Extract user IDs and fetch user data using the RPC function
    const userIds = testimonialsData.map(t => t.user_id);
    const { data: usersData, error: usersError } = await supabase
        .rpc('get_user_emails_by_ids', { p_user_ids: userIds });

    if (usersError) {
        console.error('Error fetching users for testimonials:', usersError);
        // Return testimonials without user info if user fetch fails
        return testimonialsData.map(t => ({
            ...t,
            user: { id: t.user_id, full_name: 'Anónimo', avatar_url: null }
        })) as TestimonialWithUser[];
    }

    // 3. Create a map for easy lookup
    const usersById = new Map(usersData.map((u: any) => [u.id, u]));

    // 4. Combine testimonials with user data
    return testimonialsData.map((t: any) => {
        const user = usersById.get(t.user_id);
        return {
            ...t,
            user: {
                id: t.user_id,
                full_name: user?.full_name ?? 'Anónimo',
                avatar_url: user?.avatar_url ?? null,
            }
        };
    }) as TestimonialWithUser[];
}


export default async function DiscoveryPage({ params }: DiscoveryPageProps) {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  const discoveries = await getDiscoveries(user?.id);
  const discovery = discoveries.find((d) => d.slug === params.slug);

  if (!discovery) {
    notFound();
  }
  
  const [testimonials, relatedDiscoveries] = await Promise.all([
    getTestimonials(discovery.id),
    discoveries.filter(d => d.region === discovery.region && d.id !== discovery.id).slice(0, 5)
  ]);

  const confraria = discovery.confrarias;

  const SealButton = () => (
    <form action={toggleSeal}>
      <input type="hidden" name="discoveryId" value={discovery.id} />
      <input type="hidden" name="hasSealed" value={String(discovery.user_has_sealed)} />
      <input type="hidden" name="slug" value={discovery.slug} />
      <Button type="submit" variant={discovery.user_has_sealed ? 'secondary' : 'default'} size="lg">
        <Award className="mr-2 h-5 w-5" />
        {discovery.user_has_sealed ? 'Remover Selo' : 'Conceder Selo'}
      </Button>
    </form>
  );

  return (
    <div className="container mx-auto px-4 py-8 md:py-16">
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 lg:gap-12">
        <div className="lg:col-span-3">
          {discovery.images && discovery.images.length > 0 ? (
            <Carousel className="w-full shadow-lg rounded-lg overflow-hidden">
                <CarouselContent>
                    {discovery.images.map((image, index) => (
                        <CarouselItem key={index}>
                            <div className="aspect-video relative w-full">
                                <Image
                                    src={image.imageUrl}
                                    alt={`${discovery.title} - Imagem ${index + 1}`}
                                    fill
                                    className="object-cover"
                                    data-ai-hint={image.imageHint}
                                    priority={index === 0}
                                />
                            </div>
                        </CarouselItem>
                    ))}
                </CarouselContent>
                {discovery.images.length > 1 && (
                    <>
                        <CarouselPrevious className="left-4" />
                        <CarouselNext className="right-4" />
                    </>
                )}
            </Carousel>
          ) : (
            <div className="aspect-video relative w-full overflow-hidden rounded-lg shadow-lg mb-6 bg-muted">
                 <Image
                    src="https://placehold.co/600x400.png"
                    alt="Placeholder image"
                    fill
                    className="object-cover"
                    data-ai-hint="placeholder"
                 />
            </div>
          )}
        </div>
        <div className="lg:col-span-2">
           <h1 className="font-headline text-4xl md:text-5xl font-bold mb-4">{discovery.title}</h1>
          <div className="flex flex-wrap gap-2 mb-4">
              <Badge variant="secondary" className="text-sm flex items-center gap-1"><MapPin className="h-3 w-3" />{discovery.region}</Badge>
              <Badge variant="secondary" className="text-sm flex items-center gap-1"><Tag className="h-3 w-3" />{discovery.type}</Badge>
               {discovery.seal_count > 0 && (
                <Badge variant="outline" className="text-sm flex items-center gap-1 text-primary border-primary/50">
                    <Award className="h-3 w-3" />
                    <span>{discovery.seal_count} {discovery.seal_count === 1 ? 'Selo' : 'Selos'}</span>
                </Badge>
              )}
          </div>
          
          {confraria && (
            <Link href={`/confrarias/${confraria.id}`} className="inline-block w-full">
                <Card className="mb-6 hover:bg-accent/50 transition-colors">
                <CardHeader className='flex-row items-center gap-4'>
                    <Image src={confraria.sealUrl} alt={confraria.name} width={60} height={60} className="rounded-full bg-muted p-1" data-ai-hint={confraria.sealHint} />
                    <div>
                        <p className="text-sm font-medium text-primary flex items-center gap-2"><Shield className="h-4 w-4"/> Recomendado por:</p>
                        <p className="font-semibold">{confraria.name}</p>
                    </div>
                </CardHeader>
                </Card>
            </Link>
          )}

          {discovery.contextualData && (
             <Card className="mb-6 bg-transparent border-none shadow-none">
                <CardHeader>
                    <CardTitle className="font-headline text-2xl">Informações</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-muted-foreground">
                    {discovery.contextualData.address && <p className="flex items-start gap-2"><MapPin className="h-4 w-4 text-primary mt-1 shrink-0" /> <span>{discovery.contextualData.address}</span></p>}
                    {discovery.contextualData.website && <p className="flex items-center gap-2"><Globe className="h-4 w-4 text-primary" /> <a href={discovery.contextualData.website} target="_blank" rel="noopener noreferrer" className="hover:text-primary break-all">{discovery.contextualData.website}</a></p>}
                    {discovery.contextualData.phone && <p className="flex items-center gap-2"><Phone className="h-4 w-4 text-primary" /> {discovery.contextualData.phone}</p>}
                </CardContent>
             </Card>
          )}

          {user && (
            <div className="mt-6">
              <SealButton />
            </div>
          )}

        </div>
      </div>

       <div className="mt-8 lg:mt-0 lg:col-span-5 prose max-w-none">
          <h2 className="font-headline text-3xl font-bold mb-4 border-b pb-2">A Nossa Descoberta</h2>
          <p className="text-lg leading-relaxed whitespace-pre-wrap font-body text-foreground/90">{discovery.editorial}</p>
      </div>

       <section className="mt-16 md:mt-24">
            <h2 className="font-headline text-3xl md:text-4xl font-bold mb-8 flex items-center gap-3">
                <MessageSquareQuote className="h-8 w-8 text-primary/80" />
                Testemunhos dos Confrades
            </h2>
            <DiscoveryTestimonials
                discoveryId={discovery.id}
                user={user}
                initialTestimonials={testimonials}
            />
        </section>

      {relatedDiscoveries.length > 0 && (
        <section className="mt-16 md:mt-24">
          <h2 className="font-headline text-3xl md:text-4xl font-bold mb-8 text-center">
            Mais na Região de {discovery.region}
          </h2>
          <Carousel opts={{ align: 'start' }} className="w-full">
            <CarouselContent>
              {relatedDiscoveries.map((related) => (
                <CarouselItem key={related.id} className="md:basis-1/2 lg:basis-1/3">
                  <div className="p-1 h-full">
                    <DiscoveryCard discovery={related} />
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="hidden md:flex" />
            <CarouselNext className="hidden md:flex" />
          </Carousel>
        </section>
      )}
    </div>
  );
}

