
'use server';

import { z } from 'zod';
import { createServerClient } from '@/lib/supabase/server';
import { regions } from '@/lib/data';
import { revalidatePath } from 'next/cache';

const submissionSchema = z.object({
  title: z.string().min(3, 'O título deve ter pelo menos 3 caracteres.'),
  editorial: z.string().min(10, 'A descrição deve ter pelo menos 10 caracteres.'),
  region: z.enum(regions),
  type_id: z.string({ required_error: 'Por favor, selecione um tipo.'}),
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
        console.error("Validation errors:", parsedData.error.errors);
        return { error: "Dados inválidos." };
    }

    const { title, editorial, region, type_id, confrariaId, links } = parsedData.data;

    const today = new Date();
    const formattedDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;


    const { error } = await supabase
        .from('submissions')
        .insert({
            user_id: user.id,
            discovery_title: title,
            editorial,
            region,
            type: parseInt(type_id, 10),
            confraria_id: confrariaId ? parseInt(confrariaId, 10) : null,
            links: links || null,
            status: 'Pendente',
            date: formattedDate,
        });
    
    if (error) {
        console.error("Error creating submission:", error);
        return { error: `Erro ao criar submissão: ${error.message}` };
    }

    revalidatePath('/submit');
    revalidatePath('/profile');
    revalidatePath('/admin/dashboard');
    
    return { success: true };
}
