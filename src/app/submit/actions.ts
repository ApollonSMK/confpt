
'use server';

import { z } from 'zod';
import { createServerClient } from '@/lib/supabase/server';
import { districts, type Amenity } from '@/lib/data';
import { revalidatePath } from 'next/cache';
import { createServiceRoleClient } from '@/lib/supabase/service';
import { nanoid } from 'nanoid';

const amenitySchema = z.object({
  id: z.string(),
  label: z.string(),
  icon: z.string(),
});

const submissionSchema = z.object({
  title: z.string().min(3, 'O título deve ter pelo menos 3 caracteres.'),
  editorial: z.string().min(10, 'A descrição deve ter pelo menos 10 caracteres.'),
  district: z.enum(districts, { required_error: 'Por favor, selecione um distrito.' }),
  municipality: z.string({ required_error: 'Por favor, selecione um concelho.' }),
  type_id: z.string({ required_error: 'Por favor, selecione um tipo.'}),
  confrariaId: z.string().optional(),
  address: z.string().optional(),
  website: z.string().url('URL inválido').optional().or(z.literal('')),
  phone: z.string().optional(),
  amenities: z.array(amenitySchema).optional(),
  images: z.any().optional(), // For client-side validation, not used directly here
});


export async function createSubmission(values: z.infer<typeof submissionSchema>) {
    const supabase = createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { error: "Utilizador não autenticado. Por favor, faça login." };
    }
    
    const parsedData = submissionSchema.safeParse(values);
    if (!parsedData.success) {
        console.error("Submission validation errors:", parsedData.error.errors);
        return { error: 'Dados inválidos.' };
    }

    const { title, editorial, district, municipality, type_id, confrariaId, address, website, phone, amenities, images } = parsedData.data;

    const today = new Date();
    const formattedDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    
    let galleryImageUrls: string[] | null = null;
    if (images && images.length > 0) {
        const supabaseService = createServiceRoleClient();
        galleryImageUrls = [];
        
        for (const image of Array.from(images as FileList)) {
            const fileExtension = image.name.split('.').pop();
            const fileName = `submissions/${nanoid()}.${fileExtension}`;
            
            const { error: uploadError } = await supabaseService.storage
                .from('public-images')
                .upload(fileName, image);

            if (uploadError) {
                console.error('Error uploading submission image:', uploadError);
                return { error: `Não foi possível carregar a imagem: ${image.name}` };
            }

            const { data: { publicUrl } } = supabaseService.storage
                .from('public-images')
                .getPublicUrl(fileName);
            
            galleryImageUrls.push(publicUrl);
        }
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
            website: website || null,
            address: address || null,
            phone: phone || null,
            amenities: amenities || null,
            status: 'Pendente',
            date: formattedDate,
            image_url: galleryImageUrls ? galleryImageUrls[0] : null, // Main image is the first of the gallery
            gallery_image_urls: galleryImageUrls, // Store the full gallery
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

    