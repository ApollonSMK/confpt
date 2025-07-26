
import { createServerClient } from '@/lib/supabase/server';
import type { Discovery } from '@/lib/data';
import { Map as MapIcon } from 'lucide-react';
import { ClientMapPage } from './client-page';

async function getDiscoveriesWithCoordinates(): Promise<Pick<Discovery, 'id' | 'title' | 'slug' | 'latitude' | 'longitude'>[]> {
    const supabase = createServerClient();
    const { data, error } = await supabase
        .from('discoveries')
        .select('id, title, slug, latitude, longitude')
        .not('latitude', 'is', null)
        .not('longitude', 'is', null);

    if (error) {
        console.error('Error fetching discoveries for map:', error);
        return [];
    }

    return data;
}

export default async function MapPage() {
    const discoveries = await getDiscoveriesWithCoordinates();

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
                <ClientMapPage discoveries={discoveries} />
            </div>
        </div>
    );
}
