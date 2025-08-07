
'use server';

import { z } from 'zod';
import { createServerClient } from '@/lib/supabase/server';
import { districts } from '@/lib/data';
import { revalidatePath } from 'next/cache';
import { createServiceRoleClient } from '@/lib/supabase/service';
import { nanoid } from 'nanoid';
import { redirect } from 'next/navigation';

const editDiscoverySchema = z.object({
  discoveryId: z.number(),
  title: z.string().min(3, 'O título deve ter pelo menos 3 caracteres.'),
  editorial: z.string().min(10, 'A descrição deve ter pelo menos 10 caracteres.'),
  district: z.enum(districts, { required_error: 'Por favor, selecione um distrito.' }),
  municipality: z.string({ required_error: 'Por favor, selecione um concelho.' }),
  type_id: z.string({ required_error: 'Por favor, selecione um tipo.'}),
  confrariaId: z.string().optional(),
  website: z.string().url('URL inválido').optional().or(z.literal('')),
  images: z.any().optional(), // From client form
});


export async function updateUserDiscovery(values: z.infer<typeof editDiscoverySchema>) {
    const supabase = createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { error: "Utilizador não autenticado." };
    }
    
    const parsedData = editDiscoverySchema.safeParse(values);
    if (!parsedData.success) {
        return { error: 'Dados inválidos.' };
    }

    const { discoveryId, title, editorial, district, municipality, type_id, confrariaId, website, images } = parsedData.data;

    const slug = title.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');

    // Add new images to the gallery if any were uploaded
    if (images && images.length > 0) {
        const supabaseService = createServiceRoleClient();
        for (const image of Array.from(images as FileList)) {
             const fileExtension = image.name.split('.').pop();
             const fileName = `discoveries/${discoveryId}/${nanoid()}.${fileExtension}`;
             
             const { error: uploadError } = await supabaseService.storage
                .from('public-images')
                .upload(fileName, image, { upsert: true });

            if (uploadError) {
                return { error: 'Não foi possível carregar a nova imagem.' };
            }

            const { data: { publicUrl } } = supabaseService.storage.from('public-images').getPublicUrl(fileName);
            
            // Insert into discovery_images table
            await supabaseService.from('discovery_images').insert({
                discovery_id: discoveryId,
                image_url: publicUrl,
                image_hint: 'user uploaded gallery image',
            });
        }
    }


    const updateData: any = {
        title,
        editorial,
        description: editorial.substring(0, 100) + '...',
        district,
        municipality,
        slug,
        type_id: parseInt(type_id, 10),
        confraria_id: confrariaId && confrariaId !== 'null' ? parseInt(confrariaId, 10) : null,
        website: website || null,
    };
    
    const { error: updateError } = await supabase
        .from('discoveries')
        .update(updateData)
        .eq('id', discoveryId);
    
    if (updateError) {
        console.error("Error updating discovery from user form:", updateError);
        return { error: `Erro ao atualizar a descoberta: ${updateError.message}` };
    }

    revalidatePath('/profile');
    revalidatePath(`/discoveries/${slug}`);
    
    redirect('/profile');
}

    