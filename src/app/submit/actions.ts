
'use server';

import { z } from 'zod';
import { createServerClient } from '@/lib/supabase/server';
import { districts } from '@/lib/data';
import { revalidatePath } from 'next/cache';
import { createServiceRoleClient } from '@/lib/supabase/service';
import { nanoid } from 'nanoid';

// Schema is now defined in the client component to avoid exporting non-functions from a "use server" file.
const submissionSchema = z.object({
  title: z.string().min(3, 'O título deve ter pelo menos 3 caracteres.'),
  editorial: z.string().min(10, 'A descrição deve ter pelo menos 10 caracteres.'),
  district: z.enum(districts, { required_error: 'Por favor, selecione um distrito.' }),
  municipality: z.string({ required_error: 'Por favor, selecione um concelho.' }),
  type_id: z.string({ required_error: 'Por favor, selecione um tipo.'}),
  confrariaId: z.string().optional(),
  links: z.string().url('URL inválido').optional().or(z.literal('')),
});


// The action now accepts the parsed data and the optional image separately
export async function createSubmission(
    values: z.infer<typeof submissionSchema>,
    image?: File
) {
    const supabase = createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { error: "Utilizador não autenticado. Por favor, faça login." };
    }
    
    const parsedData = submissionSchema.safeParse(values);
    if (!parsedData.success) {
        return { error: 'Dados inválidos.' };
    }

    const { title, editorial, district, municipality, type_id, confrariaId, links } = parsedData.data;

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
            district,
            municipality,
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
