
'use client';

import { useState, useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { createClient } from '@/lib/supabase/client';
import type { Discovery } from '@/lib/data';
import { Map as MapIcon } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export default function MapPage() {
    const [discoveries, setDiscoveries] = useState<Pick<Discovery, 'id' | 'title' | 'slug' | 'latitude' | 'longitude'>[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const supabase = createClient();
        async function getDiscoveriesWithCoordinates() {
            const { data, error } = await supabase
                .from('discoveries')
                .select('id, title, slug, latitude, longitude')
                .not('latitude', 'is', null)
                .not('longitude', 'is', null);

            if (error) {
                console.error('Error fetching discoveries for map:', error);
            } else {
                setDiscoveries(data);
            }
            setLoading(false);
        }
        getDiscoveriesWithCoordinates();
    }, []);

    const InteractiveMap = useMemo(() => dynamic(() => import('@/components/interactive-map'), {
        ssr: false,
        loading: () => <Skeleton className="h-full w-full" />
    }), []);


    return (
        <div className="flex flex-col h-[calc(100vh-5rem)]">
            <div className="bg-card border-b p-4">
                <div className="container mx-auto">
                    <h1 className="font-headline text-3xl md:text-4xl font-bold flex items-center gap-3">
                        <MapIcon className="h-8 w-8 text-primary"/>
                        Mapa Interativo
                    </h1>
                    <p className="text-muted-foreground mt-1">Explore as descobertas de Portugal no nosso mapa interativo.</p>
                </div>
            </div>
            <div className="flex-grow">
                {loading ? <Skeleton className="h-full w-full" /> : <InteractiveMap discoveries={discoveries} />}
            </div>
        </div>
    );
}
