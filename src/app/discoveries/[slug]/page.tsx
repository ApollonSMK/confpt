import Image from 'next/image';
import { notFound, redirect } from 'next/navigation';
import { getDiscoveries } from '@/lib/data-server';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { DiscoveryCard } from '@/components/discovery-card';
import { MapPin, Tag, Globe, Phone, Award, Shield } from 'lucide-react';
import Link from 'next/link';
import { createServerClient } from '@/lib/supabase/server';
import { toggleSeal } from './actions';
import { Button } from '@/components/ui/button';

type DiscoveryPageProps = {
  params: {
    slug: string;
  };
};

export default async function DiscoveryPage({ params }: DiscoveryPageProps) {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  const discoveries = await getDiscoveries(user?.id);
  const discovery = discoveries.find((d) => d.slug === params.slug);

  if (!discovery) {
    notFound();
  }
  
  const confraria = discovery.confrarias;
  const relatedDiscoveries = discoveries.filter(d => d.region === discovery.region && d.id !== discovery.id).slice(0, 5);

  const SealButton = () => (
    <form action={toggleSeal}>
      <input type="hidden" name="discoveryId" value={discovery.id} />
      <input type="hidden" name="hasSealed" value={String(discovery.user_has_sealed)} />
      <input type="hidden" name="slug" value={discovery.slug} />
      <Button type="submit" variant={discovery.user_has_sealed ? 'secondary' : 'default'} size="lg">
        <Award className="mr-2 h-5 w-5" />
        {discovery.user_has_sealed ? 'Remover Selo de Confrade' : 'Conceder Selo de Confrade'}
      </Button>
    </form>
  );

  return (
    <div className="container mx-auto px-4 py-8 md:py-16">
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 lg:gap-12">
        <div className="lg:col-span-3">
          <div className="aspect-video relative w-full overflow-hidden rounded-lg shadow-lg mb-6">
            <Image
              src={discovery.imageUrl}
              alt={discovery.title}
              fill
              className="object-cover"
              data-ai-hint={discovery.imageHint}
              priority
            />
          </div>
        </div>
        <div className="lg:col-span-2">
          <div className="flex flex-wrap gap-2 mb-4">
              <Badge variant="secondary" className="text-sm flex items-center gap-1"><MapPin className="h-3 w-3" />{discovery.region}</Badge>
              <Badge variant="secondary" className="text-sm flex items-center gap-1"><Tag className="h-3 w-3" />{discovery.type}</Badge>
              <Badge variant="outline" className="text-sm flex items-center gap-1"><Award className="h-3 w-3 text-primary" />{discovery.seal_count} {discovery.seal_count === 1 ? 'Selo' : 'Selos'}</Badge>
          </div>
          <h1 className="font-headline text-4xl md:text-5xl font-bold mb-4">{discovery.title}</h1>

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
