
'use server';

import { z } from 'zod';
import { createServerClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { createServiceRoleClient } from '@/lib/supabase/service';
import { districts } from '@/lib/data';
import { nanoid } from 'nanoid';

const detailsFormSchema = z.object({
  id: z.number(),
  motto: z.string().min(5, 'O lema deve ter pelo menos 5 caracteres.'),
  history: z.string().optional(),
  founders: z.string().optional(),
});

const eventFormSchema = z.object({
  id: z.number().optional(), // optional for new events
  confraria_id: z.number(),
  name: z.string().min(3, 'O nome do evento deve ter pelo menos 3 caracteres.'),
  description: z.string().optional(),
  event_date: z.coerce.date({ required_error: 'Por favor, selecione uma data para o evento.'}),
  location: z.string().min(3, 'A localização deve ter pelo menos 3 caracteres.').optional().or(z.literal('')),
  district: z.enum(districts, { required_error: 'Por favor, selecione um distrito.'}),
  municipality: z.string({ required_error: 'Por favor, selecione um concelho.'}).optional().or(z.literal('')),
  is_public: z.boolean().default(true),
  image: z.any().optional(), // for the file upload
});

const articleSchema = z.object({
  id: z.number().optional(),
  confraria_id: z.number(),
  author_id: z.string().uuid(),
  title: z.string().min(3, 'O título deve ter pelo menos 3 caracteres.'),
  content: z.string().min(10, 'O conteúdo deve ter pelo menos 10 caracteres.'),
  image: z.any().optional(),
  status: z.enum(['draft', 'published']),
});

const recipeSchema = z.object({
    id: z.number().optional(),
    confraria_id: z.number(),
    author_id: z.string().uuid(),
    title: z.string().min(3, 'O título deve ter pelo menos 3 caracteres.'),
    description: z.string().optional(),
    prep_time_minutes: z.coerce.number().optional(),
    cook_time_minutes: z.coerce.number().optional(),
    servings: z.coerce.number().optional(),
    ingredients: z.string().min(10, 'Os ingredientes devem ter pelo menos 10 caracteres.'),
    instructions: z.string().min(10, 'As instruções devem ter pelo menos 10 caracteres.'),
    image: z.any().optional(),
    status: z.enum(['draft', 'published']),
});


async function checkPermissions(confrariaId: number) {
    const supabase = createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        throw new Error('Not authenticated');
    }

    const supabaseService = createServiceRoleClient();
    const { data: confraria, error } = await supabaseService
        .from('confrarias')
        .select('responsible_user_id')
        .eq('id', confrariaId)
        .single(); 
    
    if (error) {
        console.error("Permission check error:", error);
        throw new Error('Confraria not found or error checking permissions.');
    }

    const isAdmin = user.email === process.env.ADMIN_EMAIL;
    const isResponsible = confraria?.responsible_user_id === user.id;

    if (!isAdmin && !isResponsible) {
        throw new Error('Not authorized');
    }
    return user;
}


export async function updateConfrariaDetails(values: z.infer<typeof detailsFormSchema>) {
    
    const parsedData = detailsFormSchema.safeParse(values);

    if (!parsedData.success) {
        return { error: "Dados inválidos." };
    }
    
    const { id, motto, history, founders } = parsedData.data;

    await checkPermissions(id);

    const supabase = createServiceRoleClient();

    const { error } = await supabase
        .from('confrarias')
        .update({
            motto,
            history,
            founders,
        })
        .eq('id', id);

    if (error) {
        console.error("Error updating confraria details by manager:", error);
        return { error: `Erro ao atualizar confraria: ${error.message}` };
    }

    revalidatePath(`/confrarias/${id}`);
    revalidatePath(`/confrarias/${id}/manage`);
    
    return { success: true, message: "Detalhes da confraria atualizados com sucesso." };
}


export async function upsertEvent(formData: FormData) {
    const supabaseService = createServiceRoleClient();

    const values = {
        id: formData.get('id') ? Number(formData.get('id')) : undefined,
        confraria_id: Number(formData.get('confraria_id')),
        name: formData.get('name') as string,
        description: formData.get('description') as string,
        event_date: formData.get('event_date') as string,
        location: formData.get('location') as string,
        district: formData.get('district') as any,
        municipality: formData.get('municipality') as string,
        is_public: formData.get('is_public') === 'true',
        image: formData.get('image') as File,
    };

    const parsedData = eventFormSchema.safeParse(values);

    if (!parsedData.success) {
        console.error('Event validation error:', parsedData.error.flatten().fieldErrors);
        return { error: "Dados do evento inválidos." };
    }
    
    const { id, confraria_id, name, description, event_date, location, district, municipality, image, is_public } = parsedData.data;

    // Check permissions before upserting
    await checkPermissions(confraria_id);
    
    let imageUrl: string | undefined | null = formData.get('current_image_url') as string;

    if (image instanceof File && image.size > 0) {
        const fileExtension = image.name.split('.').pop();
        const fileName = `events/${nanoid()}.${fileExtension}`;
        
        const { error: uploadError } = await supabaseService.storage
            .from('public-images')
            .upload(fileName, image, {
                cacheControl: '3600',
                upsert: true
            });

        if (uploadError) {
            console.error('Error uploading event image:', uploadError);
            return { error: 'Não foi possível carregar a imagem.' };
        }

        const { data: publicUrlData } = supabaseService.storage
            .from('public-images')
            .getPublicUrl(fileName);

        imageUrl = publicUrlData.publicUrl;
    }


    const eventData = {
        confraria_id,
        name,
        description: description || null,
        event_date: event_date.toISOString().split('T')[0], // Format as YYYY-MM-DD
        location: location || null,
        district,
        municipality: municipality || null,
        is_public,
        image_url: imageUrl || 'https://placehold.co/600x400.png',
        image_hint: 'event placeholder',
    };

    let error;
    if (id) {
        // Update existing event
        const { error: updateError } = await supabaseService
            .from('events')
            .update(eventData)
            .eq('id', id);
        error = updateError;
    } else {
        // Create new event
        const { error: insertError } = await supabaseService
            .from('events')
            .insert(eventData);
        error = insertError;
    }
    
    if (error) {
        console.error("Error upserting event:", error);
        return { error: `Erro ao guardar evento: ${error.message}` };
    }

    revalidatePath(`/confrarias/${confraria_id}`);
    revalidatePath(`/confrarias/${confraria_id}/manage`);
    revalidatePath('/events');

    return { success: true, message: id ? "Evento atualizado!" : "Evento criado!" };
}

export async function deleteEvent(eventId: number, confrariaId: number) {
    'use server';
    await checkPermissions(confrariaId);
    
    const supabaseService = createServiceRoleClient();
    const { error } = await supabaseService
        .from('events')
        .delete()
        .eq('id', eventId);
    
    if (error) {
        console.error("Error deleting event:", error);
        return { error: 'Ocorreu um erro ao apagar o evento.' };
    }
    
    revalidatePath(`/confrarias/${confrariaId}`);
    revalidatePath(`/confrarias/${confrariaId}/manage`);
    revalidatePath('/events');
    
    return { success: true };
}


export async function upsertArticle(formData: FormData) {
    'use server';
    
    const confraria_id = Number(formData.get('confraria_id'));
    const supabaseService = createServiceRoleClient();
    
    const user = await checkPermissions(confraria_id);

    const values = {
        id: formData.get('id') ? Number(formData.get('id')) : undefined,
        confraria_id: confraria_id,
        author_id: user.id,
        title: formData.get('title') as string,
        content: formData.get('content') as string,
        image: formData.get('image') as File,
        status: formData.get('status') as 'draft' | 'published',
    };

    const parsedData = articleSchema.safeParse(values);
    if (!parsedData.success) {
        console.error('Article validation error', parsedData.error.flatten());
        return { error: 'Dados do artigo inválidos.' };
    }

    const { id, author_id, title, content, image, status } = parsedData.data;
    
    const slug = title.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '') + `-${nanoid(4)}`;

    let imageUrl: string | undefined | null = formData.get('current_image_url') as string;

    if (image instanceof File && image.size > 0) {
        const fileExtension = image.name.split('.').pop();
        const fileName = `articles/${nanoid()}.${fileExtension}`;
        
        const { error: uploadError } = await supabaseService.storage
            .from('public-images')
            .upload(fileName, image, {
                cacheControl: '3600',
                upsert: true
            });

        if (uploadError) {
            console.error('Error uploading article image:', uploadError);
            return { error: 'Não foi possível carregar a imagem.' };
        }

        const { data: publicUrlData } = supabaseService.storage
            .from('public-images')
            .getPublicUrl(fileName);

        imageUrl = publicUrlData.publicUrl;
    }

    const articleData: any = {
        confraria_id,
        author_id,
        title,
        content,
        status,
        image_url: imageUrl,
        image_hint: 'article cover',
    };
    
    if (!id) {
        articleData.slug = slug;
    }
    
    const existingArticle = id ? await supabaseService.from('articles').select('published_at').eq('id', id).single() : null;
    
    if (status === 'published' && !existingArticle?.data?.published_at) {
        articleData.published_at = new Date().toISOString();
    }


    let error;
    if (id) {
        const { error: updateError } = await supabaseService
            .from('articles')
            .update(articleData)
            .eq('id', id);
        error = updateError;
    } else {
        const { error: insertError } = await supabaseService
            .from('articles')
            .insert(articleData);
        error = insertError;
    }

    if (error) {
        console.error("Error upserting article:", error);
        return { error: `Erro ao guardar publicação: ${error.message}` };
    }

    revalidatePath(`/confrarias/${confraria_id}`);
    revalidatePath(`/confrarias/${confraria_id}/manage`);

    return { success: true, message: id ? 'Publicação atualizada!' : 'Publicação criada!' };
}

export async function deleteArticle(articleId: number, confrariaId: number) {
    'use server';

    await checkPermissions(confrariaId);

    const supabaseService = createServiceRoleClient();
    const { error } = await supabaseService.from('articles').delete().eq('id', articleId);
    
    if (error) {
        console.error("Error deleting article:", error);
        return { error: 'Ocorreu um erro ao apagar a publicação.' };
    }

    revalidatePath(`/confrarias/${confrariaId}`);
    revalidatePath(`/confrarias/${confrariaId}/manage`);

    return { success: true };
}

export async function upsertRecipe(formData: FormData) {
    'use server';
    const supabaseService = createServiceRoleClient();

    const values = {
        id: formData.get('id') ? Number(formData.get('id')) : undefined,
        confraria_id: Number(formData.get('confraria_id')),
        author_id: formData.get('author_id') as string,
        title: formData.get('title') as string,
        description: formData.get('description') as string,
        prep_time_minutes: formData.get('prep_time_minutes'),
        cook_time_minutes: formData.get('cook_time_minutes'),
        servings: formData.get('servings'),
        ingredients: formData.get('ingredients') as string,
        instructions: formData.get('instructions') as string,
        image: formData.get('image') as File,
        status: formData.get('status') as 'draft' | 'published',
    };
    
    const parsedData = recipeSchema.safeParse(values);
    if (!parsedData.success) {
        console.error('Recipe validation error', parsedData.error.flatten());
        return { error: 'Dados da receita inválidos.' };
    }
    
    const { id, confraria_id, author_id, title, description, ingredients, instructions, image, status, prep_time_minutes, cook_time_minutes, servings } = parsedData.data;
    
    await checkPermissions(confraria_id);
    
    const slug = title.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '') + `-${nanoid(4)}`;
    let imageUrl: string | undefined | null = formData.get('current_image_url') as string;
    
    if (image instanceof File && image.size > 0) {
        const fileExtension = image.name.split('.').pop();
        const fileName = `recipes/${nanoid()}.${fileExtension}`;
        
        const { error: uploadError } = await supabaseService.storage
            .from('public-images')
            .upload(fileName, image, { upsert: true });

        if (uploadError) return { error: 'Não foi possível carregar a imagem.' };

        imageUrl = supabaseService.storage.from('public-images').getPublicUrl(fileName).data.publicUrl;
    }
    
    const recipeData = {
        confraria_id,
        author_id,
        title,
        description: description || null,
        ingredients: ingredients || null,
        instructions: instructions || null,
        status,
        prep_time_minutes: prep_time_minutes || null,
        cook_time_minutes: cook_time_minutes || null,
        servings: servings || null,
        slug: id ? undefined : slug,
        image_url: imageUrl,
        image_hint: 'recipe photo',
        published_at: undefined as (string | undefined),
    };
    
    let error;
    if (id) {
        const { error: updateError } = await supabaseService.from('recipes').update(recipeData).eq('id', id);
        error = updateError;
    } else {
        const { error: insertError } = await supabaseService.from('recipes').insert(recipeData);
        error = insertError;
    }
    
    if (error) return { error: `Erro ao guardar receita: ${error.message}` };
    
    revalidatePath(`/confrarias/${confraria_id}`);
    revalidatePath(`/confrarias/${confraria_id}/manage`);
    
    return { success: true, message: id ? 'Receita atualizada!' : 'Receita criada!' };
}

export async function deleteRecipe(recipeId: number, confrariaId: number) {
    'use server';
    await checkPermissions(confrariaId);

    const supabaseService = createServiceRoleClient();
    const { error } = await supabaseService.from('recipes').delete().eq('id', recipeId);
    
    if (error) {
        console.error("Error deleting recipe:", error);
        return { error: 'Ocorreu um erro ao apagar a receita.' };
    }

    revalidatePath(`/confrarias/${confrariaId}`);
    revalidatePath(`/confrarias/${confrariaId}/manage`);

    return { success: true };
}

export async function addCroppedGalleryImage({
    confrariaId,
    image,
    description
}: {
    confrariaId: number,
    image: Blob,
    description: string
}) {
    await checkPermissions(confrariaId);
    const supabaseService = createServiceRoleClient();

    const fileName = `gallery/${confrariaId}/${nanoid()}.webp`;

    const { error: uploadError } = await supabaseService.storage
        .from('public-images')
        .upload(fileName, image, {
            cacheControl: '3600',
            upsert: true,
            contentType: 'image/webp'
        });

    if (uploadError) {
        console.error("Error uploading cropped gallery image:", uploadError);
        return { error: `Falha ao carregar a imagem.` };
    }
    
    const { data: { publicUrl } } = supabaseService.storage.from('public-images').getPublicUrl(fileName);

    const { error: dbError } = await supabaseService.from('confraria_gallery_images').insert({
        confraria_id: confrariaId,
        image_url: publicUrl,
        description: description || null,
        sort_order: 0,
    });

    if (dbError) {
        console.error("Error saving cropped gallery image to DB:", dbError);
        await supabaseService.storage.from('public-images').remove([fileName]);
        return { error: `Erro ao guardar a imagem na base de dados.` };
    }
    
    revalidatePath(`/confrarias/${confrariaId}`);
    revalidatePath(`/confrarias/${confrariaId}/manage`);

    return { success: true, message: "Imagem adicionada com sucesso!" };
}

export async function addGalleryImage(formData: FormData) {
    'use server';
    const confrariaId = Number(formData.get('confrariaId'));
    const images = formData.getAll('images') as File[];
    const description = formData.get('description') as string;
    
    if (!confrariaId) return { error: 'ID da confraria em falta.' };
    
    const validImages = images.filter(image => image instanceof File && image.size > 0);
    if (validImages.length === 0) return { error: 'Nenhuma imagem válida selecionada.' };


    await checkPermissions(confrariaId);
    const supabaseService = createServiceRoleClient();
    
    for (const image of validImages) {
        const fileName = `gallery/${confrariaId}/${nanoid()}.${image.name.split('.').pop()}`;

        const { error: uploadError } = await supabaseService.storage
            .from('public-images')
            .upload(fileName, image, {
                cacheControl: '3600',
                upsert: true,
            });

        if (uploadError) {
            console.error("Error uploading gallery image:", uploadError);
            return { error: `Falha ao carregar a imagem: ${uploadError.message}` };
        }
        
        const { data: { publicUrl } } = supabaseService.storage.from('public-images').getPublicUrl(fileName);

        const { error: dbError } = await supabaseService.from('confraria_gallery_images').insert({
            confraria_id: confrariaId,
            image_url: publicUrl,
            description: description || null,
            sort_order: 0
        });

        if (dbError) {
            console.error("Error saving gallery image to DB:", dbError);
            await supabaseService.storage.from('public-images').remove([fileName]);
            return { error: `Erro ao guardar a imagem na base de dados: ${dbError.message}` };
        }
    }
    
    revalidatePath(`/confrarias/${confrariaId}/manage`);
    revalidatePath(`/confrarias/${confrariaId}`);

    return { success: true, message: "Imagens adicionadas com sucesso!" };
}


export async function deleteGalleryImage(id: number, confrariaId: number) {
    'use server';
    await checkPermissions(confrariaId);
    
    const supabase = createServiceRoleClient();
    const { data: image, error: fetchError } = await supabase.from('confraria_gallery_images').select('image_url').eq('id', id).single();

    if (fetchError || !image) {
        return { error: 'Imagem não encontrada.' };
    }

    const { error } = await supabase.from('confraria_gallery_images').delete().eq('id', id);

    if (error) {
        return { error: 'Erro ao apagar imagem da galeria.' };
    }
    
    try {
      const filePath = new URL(image.image_url).pathname.split('/public-images/')[1];
      if (filePath) {
          await supabase.storage.from('public-images').remove([filePath]);
      }
    } catch(e) {
        console.error("Could not parse or delete storage object, may already be gone:", e);
    }

    revalidatePath(`/confrarias/${confrariaId}/manage`);
    revalidatePath(`/confrarias/${confrariaId}`);
    return { success: true, message: 'Imagem removida.' };
}

