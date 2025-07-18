'use server';

import { createServerClient } from "@/lib/supabase/server";
import { type Submission, discoveryTypes, regions } from "@/lib/data";
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
