
import { createServerClient } from '@/lib/supabase/server';
import type { Confraria, Discovery } from '@/lib/data';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import { MapPin } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { DiscoveryCard } from '@/components/discovery-card';

type ConfrariaPageProps = {
  params: {
    confrariaId: string;
  };
};

type ConfrariaDetails = Confraria & {
  discoveries: Discovery[];
};

async function getConfrariaDetails(id: string): Promise<ConfrariaDetails | null> {
    const supabase = createServerClient();
    const { data: confraria, error } = await supabase
        .from('confrarias')
        .select(`
            *,
            discoveries (
                *,
                confrarias (
                    id,
                    name,
                    seal_url,
                    seal_hint
                ),
                discovery_seal_counts (
                    seal_count
                )
            )
        `)
        .eq('id', id)
        .single();
    
    if (error || !confraria) {
        console.error(`Error fetching confraria with id ${id}:`, error);
        return null;
    }

    const discoveries = confraria.discoveries.map((d: any) => ({
        ...d,
        confrariaId: d.confraria_id,
        imageUrl: d.image_url,
        imageHint: d.image_hint,
        contextualData: {
            address: d.address,
            website: d.website,
            phone: d.phone
        },
        confrarias: d.confrarias ? { ...d.confrarias, sealUrl: d.confrarias.seal_url, sealHint: d.confrarias.seal_hint } : undefined,
        seal_count: d.discovery_seal_counts[0]?.seal_count || 0,
        // Na página de uma confraria, podemos assumir que o user não selou ainda,
        // ou teríamos que passar o user_id para esta função.
        // Por simplicidade, vamos deixar como false por agora.
        user_has_sealed: false, 
    })) as unknown as Discovery[];

    return {
        ...confraria,
        sealUrl: confraria.seal_url,
        sealHint: confraria.seal_hint,
        discoveries,
    } as ConfrariaDetails;
}


export default async function ConfrariaPage({ params }: ConfrariaPageProps) {
    const confraria = await getConfrariaDetails(params.confrariaId);

    if (!confraria) {
        notFound();
    }

    return (
        <div className="container mx-auto px-4 py-8 md:py-16">
            <section className="text-center mb-12 md:mb-16">
                 <Image
                    src={confraria.sealUrl}
                    alt={`Selo da ${confraria.name}`}
                    width={150}
                    height={150}
                    className="rounded-full bg-muted p-3 shadow-lg mx-auto mb-6"
                    data-ai-hint={confraria.sealHint}
                />
                <h1 className="font-headline text-4xl md:text-6xl font-bold text-primary mb-2">
                    {confraria.name}
                </h1>
                <p className="text-xl md:text-2xl italic text-muted-foreground mb-4">
                    &quot;{confraria.motto}&quot;
                </p>
                <Badge variant="secondary" className="text-base flex items-center gap-2 w-fit mx-auto px-4 py-1">
                    <MapPin className="h-4 w-4" />
                    <span>{confraria.region}</span>
                </Badge>
            </section>
            
            <section>
                 <h2 className="font-headline text-3xl md:text-4xl font-bold mb-8 text-center">
                    Descobertas Recomendadas
                </h2>
                {confraria.discoveries && confraria.discoveries.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {confraria.discoveries.map((discovery) => (
                        <DiscoveryCard key={discovery.id} discovery={discovery} />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-12 text-muted-foreground">
                        <p className="font-semibold text-lg">Nenhuma descoberta por aqui... ainda.</p>
                        <p>Esta confraria ainda não partilhou os seus segredos.</p>
                    </div>
                )}
            </section>
        </div>
    );
}

