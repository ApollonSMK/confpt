
'use client';

import type { Discovery } from '@/lib/data';
import InteractiveMap from '@/components/interactive-map';

interface ClientMapPageProps {
  discoveries: Pick<Discovery, 'id' | 'title' | 'slug' | 'latitude' | 'longitude'>[];
}

export function ClientMapPage({ discoveries }: ClientMapPageProps) {
    if (typeof window === 'undefined') {
        return <div className="h-[calc(100vh-10rem)] w-full bg-muted animate-pulse rounded-lg flex items-center justify-center"><p>A carregar mapa...</p></div>;
    }
    
    return (
        <InteractiveMap discoveries={discoveries} />
    );
}
