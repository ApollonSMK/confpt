

import Image from 'next/image';
import { notFound } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DiscoveryCard } from '@/components/discovery-card';
import { MapPin, Tag, Globe, Phone, Award, Shield, MessageSquareQuote, Camera, NotebookText, Star, Wifi, Car, Accessibility } from 'lucide-react';
import Link from 'next/link';
import { createServerClient } from '@/lib/supabase/server';
import { toggleSeal } from './actions';
import { Button } from '@/components/ui/button';
import type { Discovery, TestimonialWithUser, DiscoveryImage, Amenity } from '@/lib/data';
import { DiscoveryTestimonials } from '@/components/discovery-testimonials';
import { createServiceRoleClient } from '@/lib/supabase/service';
import { Dialog, DialogContent, DialogTrigger, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MapboxDisplay } from '@/components/mapbox-display';


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
                id,
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
            id: img.id,
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

    const userIds = testimonialsData.map(t => t.user_id);
    const { data: usersData, error: usersError } = await supabase
        .rpc('get_user_emails_by_ids', { p_user_ids: userIds });

    if (usersError) {
        console.error('Error fetching users for testimonials:', usersError);
        return testimonialsData.map(t => ({
            ...t,
            user: { id: t.user_id, full_name: 'Anónimo', avatar_url: null }
        })) as TestimonialWithUser[];
    }

    const usersById = new Map(usersData.map((u: any) => [u.id, u]));

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

async function getMapboxApiKey(): Promise<string> {
    const supabase = createServiceRoleClient();
    const { data, error } = await supabase
        .from('settings')
        .select('value')
        .eq('key', 'mapbox_api_key')
        .single();
    
    if (error || !data) {
        console.error("Could not fetch Mapbox API key:", error);
        return '';
    }
    return data.value || '';
}

const amenityIcons: { [key: string]: LucideIcon } = {
  wifi: Wifi,
  parking: Car,
  accessible: Accessibility,
  default: Star,
};


export default async function DiscoveryPage({ params }: DiscoveryPageProps) {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  const discoveries = await getDiscoveries(user?.id);
  const discovery = discoveries.find((d) => d.slug === params.slug);

  if (!discovery) {
    notFound();
  }
  
  const [testimonials, relatedDiscoveries, mapboxApiKey] = await Promise.all([
    getTestimonials(discovery.id),
    discoveries.filter(d => d.district === discovery.district && d.id !== discovery.id).slice(0, 5),
    getMapboxApiKey()
  ]);

  const confraria = discovery.confrarias;
  const mainImage = discovery.images && discovery.images.length > 0 ? discovery.images[0] : { imageUrl: 'https://placehold.co/1200x800.png', imageHint: 'placeholder' };

  const SealButton = () => (
    <form action={toggleSeal}>
      <input type="hidden" name="discoveryId" value={discovery.id} />
      <input type="hidden" name="hasSealed" value={String(discovery.user_has_sealed)} />
      <input type="hidden" name="slug" value={discovery.slug} />
      <Button type="submit" variant={discovery.user_has_sealed ? 'secondary' : 'default'} size="lg" className="w-full">
        <Award className="mr-2 h-5 w-5" />
        {discovery.user_has_sealed ? 'Remover Selo' : 'Conceder Selo'}
      </Button>
    </form>
  );

  return (
    <div className="container mx-auto px-4 py-8 md:py-16">
      
      {discovery.images && discovery.images.length > 0 ? (
            <Carousel className="w-full mb-8">
                <CarouselContent className="h-96">
                    {discovery.images.map((image, index) => (
                        <CarouselItem key={index}>
                            <Dialog>
                                <DialogTrigger asChild>
                                    <div className="relative w-full h-full rounded-lg shadow-lg overflow-hidden cursor-pointer">
                                        <Image
                                            src={image.imageUrl}
                                            alt={`${discovery.title} - Imagem ${index + 1}`}
                                            fill
                                            className="object-cover"
                                            data-ai-hint={image.imageHint}
                                            priority={index === 0}
                                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                        />
                                    </div>
                                </DialogTrigger>
                                <DialogContent className="max-w-4xl p-2">
                                     <Image src={image.imageUrl} alt={image.imageHint || 'Imagem da galeria'} width={1600} height={900} className="rounded-md object-contain"/>
                                </DialogContent>
                            </Dialog>
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
             <div className="aspect-video relative w-full rounded-lg shadow-lg overflow-hidden mb-8">
                <Image src={mainImage.imageUrl} alt={discovery.title} fill className="object-cover" data-ai-hint={mainImage.imageHint} priority />
             </div>
        )}

      <header className="mb-8">
        <h1 className="font-headline text-4xl md:text-5xl font-bold mb-2">{discovery.title}</h1>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-muted-foreground">
            <span className="flex items-center gap-1"><MapPin className="h-4 w-4 text-primary" />{discovery.district}</span>
            <span className="flex items-center gap-1"><Tag className="h-4 w-4 text-primary" />{discovery.type}</span>
            {discovery.seal_count > 0 && (
                <span className="flex items-center gap-1">
                    <Award className="h-4 w-4 text-primary" />
                    <span>{discovery.seal_count} {discovery.seal_count === 1 ? 'Selo' : 'Selos'}</span>
                </span>
            )}
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
        <div className="lg:col-span-2">
            <Tabs defaultValue="discovery" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 mb-6">
                        <TabsTrigger value="discovery"><NotebookText className="mr-2 h-4 w-4"/>A Descoberta</TabsTrigger>
                        <TabsTrigger value="testimonials"><MessageSquareQuote className="mr-2 h-4 w-4"/>Testemunhos</TabsTrigger>
                    </TabsList>
                <TabsContent value="discovery" className="mt-6">
                    <div className="prose max-w-none">
                        <h2 className="font-headline text-3xl font-bold mb-4 border-b pb-2">A Nossa Descoberta</h2>
                        <p className="text-lg leading-relaxed whitespace-pre-wrap font-body text-foreground/90">{discovery.editorial}</p>
                    </div>
                </TabsContent>
                <TabsContent value="testimonials" className="mt-6">
                    <DiscoveryTestimonials
                        discoveryId={discovery.id}
                        user={user}
                        initialTestimonials={testimonials}
                    />
                </TabsContent>
            </Tabs>
        </div>

        <aside className="lg:col-span-1 space-y-8 sticky top-24 self-start">
             {user && (
                <div className="mt-6">
                <SealButton />
                </div>
            )}
            
             <Card>
                <CardHeader><CardTitle className="font-headline text-2xl">Localização</CardTitle></CardHeader>
                <CardContent>
                     {discovery.contextualData?.address ? (
                        <>
                           <div className="mb-4">
                                <MapboxDisplay apiKey={mapboxApiKey} address={discovery.contextualData.address} title={discovery.title} />
                            </div>
                            <p className="flex items-start gap-2 text-muted-foreground"><MapPin className="h-4 w-4 text-primary mt-1 shrink-0" /> <span>{discovery.contextualData.address}</span></p>
                        </>
                    ) : (
                        <p className="text-muted-foreground text-sm">A morada não foi especificada.</p>
                    )}
                </CardContent>
            </Card>

             {discovery.amenities && discovery.amenities.length > 0 && (
                <Card>
                    <CardHeader><CardTitle className="font-headline text-2xl">Comodidades</CardTitle></CardHeader>
                    <CardContent className="grid grid-cols-2 gap-4">
                        {discovery.amenities.map(amenity => {
                            const Icon = amenityIcons[amenity.icon] || amenityIcons.default;
                            return (
                                <div key={amenity.id} className="flex items-center gap-2">
                                    <Icon className="h-5 w-5 text-primary"/>
                                    <span className="text-sm font-medium">{amenity.label}</span>
                                </div>
                            );
                        })}
                    </CardContent>
                </Card>
            )}


            {confraria && (
                <Link href={`/confrarias/${confraria.id}`} className="block">
                    <Card className="hover:bg-accent/50 transition-colors">
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
                <Card>
                    <CardHeader><CardTitle className="font-headline text-2xl">Contactos</CardTitle></CardHeader>
                    <CardContent className="space-y-2 text-muted-foreground">
                        {discovery.contextualData.website && <p className="flex items-center gap-2"><Globe className="h-4 w-4 text-primary" /> <a href={discovery.contextualData.website} target="_blank" rel="noopener noreferrer" className="hover:text-primary break-all">{discovery.contextualData.website}</a></p>}
                        {discovery.contextualData.phone && <p className="flex items-center gap-2"><Phone className="h-4 w-4 text-primary" /> {discovery.contextualData.phone}</p>}
                        {!discovery.contextualData.website && !discovery.contextualData.phone && <p className="text-sm">Não foram fornecidos contactos.</p>}
                    </CardContent>
                </Card>
            )}
        </aside>
      </div>

      {relatedDiscoveries.length > 0 && (
        <section className="mt-16 md:mt-24">
          <h2 className="font-headline text-3xl md:text-4xl font-bold mb-8 text-center">
            Mais no Distrito de {discovery.district}
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
