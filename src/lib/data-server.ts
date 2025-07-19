
import { createServerClient } from './supabase/server';
import { createServiceRoleClient } from './supabase/service';
import type { Discovery, Submission, Confraria } from './data';

export async function getDiscoveries(user_id?: string): Promise<Discovery[]> {
    const supabase = createServerClient();
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
        `);

    if (error) {
        console.error('Error fetching discoveries:', error);
        return [];
    }

    let userSeals = new Set<number>();
    if (user_id) {
        const { data: sealsData } = await supabase.from('seals').select('discovery_id').eq('user_id', user_id);
        if (sealsData) {
            userSeals = new Set(sealsData.map(s => s.discovery_id));
        }
    }
    
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


export async function getConfrarias(): Promise<(Confraria & { discoveryCount: number })[]> {
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

export async function getSubmissionsForUser(userId: string): Promise<Submission[]> {
    if (!userId) {
        console.warn('No userId provided to getSubmissionsForUser');
        return [];
    }
    const supabase = createServerClient();
    const { data, error } = await supabase.from('submissions').select('*').eq('user_id', userId).order('date', { ascending: false });
    
    if (error) {
        console.error('Error fetching submissions for user:', error);
        return [];
    }

    return data.map(s => ({
        ...s,
        discoveryTitle: s.discovery_title,
    })) as Submission[];
}


export async function getSubmissionsByStatus(status: 'Pendente' | 'Aprovado' | 'Rejeitado'): Promise<Submission[]> {
    const supabaseService = createServiceRoleClient();
    const { data, error } = await supabaseService
        .from('submissions')
        .select(`
            *,
            users (
                email
            )
        `)
        .eq('status', status)
        .order('date', { ascending: true });

    if (error) {
        console.error(`Error fetching ${status} submissions:`, error);
        return [];
    }

    return data.map(s => ({
        ...s,
        discoveryTitle: s.discovery_title,
        users: s.users ? { email: s.users.email } : { email: 'Utilizador Desconhecido' },
    })) as unknown as Submission[];
}


export async function getSealedDiscoveriesForUser(userId: string): Promise<Discovery[]> {
    const supabase = createServerClient();
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
        seal_count: d.discovery_seal_counts.length > 0 ? d.discovery_seal_counts[0].seal_count : 0,
        user_has_sealed: userSeals.has(d.id),
    })) as unknown as Discovery[];
}
