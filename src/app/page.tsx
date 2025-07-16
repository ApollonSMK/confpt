import { Button } from '@/components/ui/button';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { DiscoveryCard } from '@/components/discovery-card';
import { discoveries } from '@/lib/data';
import Link from 'next/link';
import { ArrowRight, Grape } from 'lucide-react';

export default function Home() {
  const featuredDiscoveries = discoveries.slice(0, 6);

  return (
    <div className="container mx-auto px-4 py-8 md:py-16">
      <section className="text-center mb-16 md:mb-24">
        <div className="inline-block p-4 mb-4 bg-primary/10 rounded-full">
          <Grape className="w-10 h-10 text-primary" />
        </div>
        <h1 className="font-headline text-4xl md:text-6xl font-bold text-primary mb-4">
          Confrarias de Portugal
        </h1>
        <p className="text-lg md:text-xl max-w-3xl mx-auto text-muted-foreground mb-8">
          Uma viagem pelas autênticas descobertas gastronómicas e culturais, partilhadas pelas irmandades que preservam a nossa herança.
        </p>
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
        <Carousel
          opts={{
            align: 'start',
            loop: true,
          }}
          className="w-full"
        >
          <CarouselContent>
            {featuredDiscoveries.map((discovery) => (
              <CarouselItem key={discovery.id} className="md:basis-1/2 lg:basis-1/3">
                <div className="p-1 h-full">
                  <DiscoveryCard discovery={discovery} />
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="hidden md:flex" />
          <CarouselNext className="hidden md:flex" />
        </Carousel>
      </section>
    </div>
  );
}
