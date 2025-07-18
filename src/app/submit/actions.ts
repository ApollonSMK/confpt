'use server';

import { createServerClient } from "@/lib/supabase/server";
import { type Submission, discoveryTypes, regions, type Discovery } from "@/lib/data";
import { z } from "zod";
import { revalidatePath } from "next/cache";

const submissionSchema = z.object({
  title: z.string().min(3, 'O título deve ter pelo menos 3 caracteres.'),
  editorial: z.string().min(10, 'A descrição deve ter pelo menos 10 caracteres.'),
  region: z.enum(regions),
  type: z.enum(discoveryTypes),
  confrariaId: z.string().transform(Number).optional(),
  links: z.string().url('Por favor, insira um URL válido.').optional().or(z.literal('')),
});

export async function createSubmission(formData: z.infer<typeof submissionSchema>) {
    const supabase = createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { error: 'Você precisa estar logado para fazer uma submissão.' };
    }

    const submissionData = {
        user_id: user.id,
        discovery_title: formData.title,
        editorial: formData.editorial,
        region: formData.region,
        type: formData.type,
        confraria_id: formData.confrariaId,
        links: formData.links,
        status: 'Pendente'
    };

    const { error } = await supabase.from('submissions').insert(submissionData);

    if (error) {
        console.error('Error creating submission:', error);
        return { error: 'Ocorreu um erro ao enviar a sua submissão. Tente novamente.' };
    }

    revalidatePath('/profile');
    revalidatePath('/submit');

    return { success: true };
}

export async function getUserSubmissions(userId: string): Promise<Submission[]> {
    const supabase = createServerClient();
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