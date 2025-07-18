
'use server';

import { z } from 'zod';
import { createServerClient } from '@/lib/supabase/server';
import { regions, discoveryTypes } from '@/lib/data';
import { revalidatePath } from 'next/cache';

const submissionSchema = z.object({
  title: z.string().min(3, 'O título deve ter pelo menos 3 caracteres.'),
  editorial: z.string().min(10, 'A descrição deve ter pelo menos 10 caracteres.'),
  region: z.enum(regions),
  type: z.enum(discoveryTypes),
  confrariaId: z.string().optional(),
  links: z.string().url().optional().or(z.literal('')),
  image: z.any().optional(),
});

export async function createSubmission(values: z.infer<typeof submissionSchema>) {
    const supabase = createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { error: "Utilizador não autenticado. Por favor, faça login." };
    }

    const parsedData = submissionSchema.safeParse(values);

    if (!parsedData.success) {
        return { error: "Dados inválidos." };
    }

    const { title, editorial, region, type, confrariaId, links } = parsedData.data;

    const { error } = await supabase
        .from('submissions')
        .insert({
            user_id: user.id,
            discovery_title: title,
            editorial,
            region,
            type,
            confraria_id: confrariaId ? parseInt(confrariaId, 10) : null,
            links: links || null,
            status: 'Pendente',
            date: new Date().toISOString(),
        });
    
    if (error) {
        console.error("Error creating submission:", error);
        return { error: "Ocorreu um erro ao criar a sua submissão. Tente novamente." };
    }

    revalidatePath('/submit');
    revalidatePath('/profile');
    
    return { success: true };
}
