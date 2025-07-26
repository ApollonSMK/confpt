
'use client';

import type { Discovery } from '@/lib/data';
import dynamic from 'next/dynamic';
import { useMemo } from 'react';

// Dynamically import the map component to avoid SSR issues with Leaflet
// The key is to do this inside a client component.
const InteractiveMap = dynamic(() => import('@/components/interactive-map'), { 
    ssr: false,
    loading: () => <div className="h-[calc(100vh-10rem)] w-full bg-muted animate-pulse rounded-lg flex items-center justify-center"><p>A carregar mapa...</p></div>
});


interface ClientMapPageProps {
  discoveries: Pick<Discovery, 'id' | 'title' | 'slug' | 'latitude' | 'longitude'>[];
}

export function ClientMapPage({ discoveries }: ClientMapPageProps) {
    const map = useMemo(() => (
        <InteractiveMap discoveries={discoveries} />
    ), [discoveries]);

    return map;
}
