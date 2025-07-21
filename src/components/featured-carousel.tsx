
'use client';

import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { DiscoveryCard } from '@/components/discovery-card';
import type { Discovery } from '@/lib/data';

interface FeaturedCarouselProps {
    discoveries: Discovery[];
}

export function FeaturedCarousel({ discoveries }: FeaturedCarouselProps) {
    if (!discoveries || discoveries.length === 0) {
        return null;
    }

    return (
        <Carousel
          opts={{
            align: 'start',
            loop: true,
          }}
          className="w-full"
        >
          <CarouselContent>
            {discoveries.map((discovery) => (
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
    );
}
