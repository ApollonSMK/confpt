'use server';

import { supabase } from "@/lib/supabase";
import { type Discovery, type Submission } from "@/lib/data";

export async function getSealedDiscoveriesForUser(userId: string): Promise<Discovery[]> {
    const { data: seals, error: sealsError } = await supabase
        .from('seals')
        .select('discovery_id')
        .eq('user_id', userId);

    if (sealsError || !seals || seals.length === 0) {
        return [];
    }

    const discoveryIds = seals.map(s => s.discovery_id);

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
            discovery_seal_counts (
                seal_count
            )
        `)
        .in('id', discoveryIds);

     if (error) {
        console.error('Error fetching sealed discoveries:', error);
        return [];
    }

    // Since this is for the user's profile, they have sealed all of these.
    const userSeals = new Set(discoveryIds);
    
    return data.map(d => ({
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
        user_has_sealed: userSeals.has(d.id),
    })) as unknown as Discovery[];
}


export async function getUserSubmissions(userId: string): Promise<Submission[]> {
    if (!userId) return [];

    const { data, error } = await supabase.from('submissions').select('*').eq('user_id', userId).order('date', { ascending: false });
    if (error) {
        console.error('Error fetching submissions:', error);
        return [];
    }
    return data.map(s => ({
        ...s,
        discoveryTitle: s.discovery_title,
    })) as Submission[];
}