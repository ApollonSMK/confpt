

'use server';

import { z } from 'zod';
import { createServerClient } from '@/lib/supabase/server';
import { regions } from '@/lib/data';
import { revalidatePath } from 'next/cache';
import { createServiceRoleClient } from '@/lib/supabase/service';
import { nanoid } from 'nanoid';

const submissionSchema = z.object({
  title: z.string().min(3, 'O título deve ter pelo menos 3 caracteres.'),
  editorial: z.string().min(10, 'A descrição deve ter pelo menos 10 caracteres.'),
  region: z.enum(regions),
  type_id: z.string({ required_error: 'Por favor, selecione um tipo.'}),
  confrariaId: z.string().optional(),
  links: z.string().url().optional().or(z.literal('')),
  image: z.instanceof(File).optional(),
});

export async function createSubmission(formData: FormData) {
    const supabase = createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { error: "Utilizador não autenticado. Por favor, faça login." };
    }

    const values = {
        title: formData.get('title'),
        editorial: formData.get('editorial'),
        region: formData.get('region'),
        type_id: formData.get('type_id'),
        confrariaId: formData.get('confrariaId'),
        links: formData.get('links'),
        image: formData.get('image'),
    };

    const parsedData = submissionSchema.safeParse(values);

    if (!parsedData.success) {
        console.error("Validation errors:", parsedData.error.flatten().fieldErrors);
        return { error: "Dados inválidos." };
    }

    const { title, editorial, region, type_id, confrariaId, links, image } = parsedData.data;

    const today = new Date();
    const formattedDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    
    let imageUrl: string | null = null;
    if (image && image.size > 0) {
        const supabaseService = createServiceRoleClient();
        const fileExtension = image.name.split('.').pop();
        const fileName = `submissions/${nanoid()}.${fileExtension}`;
        
        const { error: uploadError } = await supabaseService.storage
            .from('public-images')
            .upload(fileName, image);

        if (uploadError) {
            console.error('Error uploading submission image:', uploadError);
            return { error: 'Não foi possível carregar a imagem.' };
        }

        const { data: { publicUrl } } = supabaseService.storage
            .from('public-images')
            .getPublicUrl(fileName);

        imageUrl = publicUrl;
    }


    const { error: insertError } = await supabase
        .from('submissions')
        .insert({
            user_id: user.id,
            discovery_title: title,
            editorial,
            region,
            type: parseInt(type_id, 10),
            confraria_id: confrariaId && confrariaId !== 'null' ? parseInt(confrariaId, 10) : null,
            links: links || null,
            status: 'Pendente',
            date: formattedDate,
            image_url: imageUrl,
        });
    
    if (insertError) {
        console.error("Error creating submission:", insertError);
        return { error: `Erro ao criar submissão: ${insertError.message}` };
    }

    revalidatePath('/submit');
    revalidatePath('/profile');
    revalidatePath('/admin/dashboard');
    
    return { success: true };
}

    