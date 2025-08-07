
import { SubmissionForm } from '@/components/submission-form';
import { createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import type { Confraria, DiscoveryType } from '@/lib/data';
import { createServiceRoleClient } from '@/lib/supabase/service';

async function getConfrarias(): Promise<(Confraria & { discoveryCount: number })[]> {
    const supabase = createServerClient();
    const { data, error } = await supabase
        .from('confrarias')
        .select(`
            *,
            discoveries (
                id
            )
        `);

    if (error) {
        console.error('Error fetching confrarias:', error);
        return [];
    }
    
    return data.map(c => ({
        ...c,
        sealUrl: c.seal_url,
        sealHint: c.seal_hint,
        discoveryCount: c.discoveries.length
    })) as (Confraria & { discoveryCount: number })[];
}

async function getDiscoveryTypes(): Promise<DiscoveryType[]> {
    const supabase = createServiceRoleClient();
    const { data, error } = await supabase.from('discovery_types').select('*').order('name');
    if (error) {
        console.error("Error fetching discovery types for submit form:", error);
        return [];
    }
    return data as DiscoveryType[];
}

async function getMapboxApiKey(): Promise<string> {
    const supabase = createServiceRoleClient();
    const { data, error } = await supabase
        .from('settings')
        .select('value')
        .eq('key', 'mapbox_api_key')
        .single();
    
    if (error || !data) {
        console.warn("Could not fetch Mapbox API key:", error);
        return '';
    }
    return data.value || '';
}

export default async function SubmitPage() {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?redirect=/submit');
  }

  const [confrarias, discoveryTypes, mapboxApiKey] = await Promise.all([
    getConfrarias(),
    getDiscoveryTypes(),
    getMapboxApiKey(),
  ]);

  return (
    <div className="container mx-auto px-4 py-8 md:py-16">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-10">
            <h1 className="font-headline text-4xl md:text-5xl font-bold mb-4">Partilhe uma Descoberta</h1>
            <p className="text-lg text-muted-foreground">
                Ajude a enriquecer o nosso mapa de tesouros. Sugira um produto, lugar ou pessoa que mereça ser conhecido.
            </p>
        </div>
        <SubmissionForm confrarias={confrarias} discoveryTypes={discoveryTypes} mapboxApiKey={mapboxApiKey} />
      </div>
    </div>
  );
}
