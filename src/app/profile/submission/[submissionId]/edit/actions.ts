
'use server';

import { z } from 'zod';
import { createServerClient } from '@/lib/supabase/server';
import { districts } from '@/lib/data';
import { revalidatePath } from 'next/cache';
import { createServiceRoleClient } from '@/lib/supabase/service';
import { nanoid } from 'nanoid';
import { redirect } from 'next/navigation';

export const editSubmissionSchema = z.object({
  id: z.number(),
  title: z.string().min(3, 'O título deve ter pelo menos 3 caracteres.'),
  editorial: z.string().min(10, 'A descrição deve ter pelo menos 10 caracteres.'),
  district: z.enum(districts, { required_error: 'Por favor, selecione um distrito.' }),
  municipality: z.string({ required_error: 'Por favor, selecione um concelho.' }),
  type_id: z.string({ required_error: 'Por favor, selecione um tipo.'}),
  confrariaId: z.string().optional(),
  links: z.string().url('URL inválido').optional().or(z.literal('')),
});


export async function updateSubmission(
    values: z.infer<typeof editSubmissionSchema>,
    image?: File
) {
    const supabase = createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { error: "Utilizador não autenticado." };
    }
    
    const { id, title, editorial, district, municipality, type_id, confrariaId, links } = values;

    // Check ownership
    const { data: existingSubmission, error: fetchError } = await supabase
        .from('submissions')
        .select('user_id')
        .eq('id', id)
        .single();
    
    if (fetchError || !existingSubmission) {
        return { error: "Submissão não encontrada." };
    }

    if (existingSubmission.user_id !== user.id) {
        return { error: "Não tem permissão para editar esta submissão." };
    }

    let imageUrl: string | null | undefined = undefined; // Use undefined to signify no change
    if (image && image.size > 0) {
        const supabaseService = createServiceRoleClient();
        const fileExtension = image.name.split('.').pop();
        const fileName = `submissions/${nanoid()}.${fileExtension}`;
        
        const { error: uploadError } = await supabaseService.storage
            .from('public-images')
            .upload(fileName, image, { upsert: true });

        if (uploadError) {
            return { error: 'Não foi possível carregar a nova imagem.' };
        }

        imageUrl = supabaseService.storage.from('public-images').getPublicUrl(fileName).data.publicUrl;
    }

    const updateData: any = {
        discovery_title: title,
        editorial,
        district,
        municipality,
        type: parseInt(type_id, 10),
        confraria_id: confrariaId && confrariaId !== 'null' ? parseInt(confrariaId, 10) : null,
        links: links || null,
    };
    
    // Only add image_url to updateData if a new one was uploaded
    if (imageUrl) {
        updateData.image_url = imageUrl;
    }

    const { error: updateError } = await supabase
        .from('submissions')
        .update(updateData)
        .eq('id', id);
    
    if (updateError) {
        return { error: `Erro ao atualizar a submissão: ${updateError.message}` };
    }

    revalidatePath('/profile');
    revalidatePath(`/profile/submission/${id}/edit`);
    
    redirect('/profile');
}
