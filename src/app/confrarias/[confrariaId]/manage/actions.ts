
'use server';

import { z } from 'zod';
import { createServerClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { createServiceRoleClient } from '@/lib/supabase/service';
import { regions } from '@/lib/data';
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
  event_date: z.date({ required_error: 'Por favor, selecione uma data para o evento.'}),
  location: z.string().optional(),
  region: z.enum(regions, { required_error: 'Por favor, selecione uma região.'}),
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

const galleryImageSchema = z.object({
    confraria_id: z.number(),
    description: z.string().optional(),
    image: z.any(),
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
        .maybeSingle(); 
    
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
        event_date: new Date(formData.get('event_date') as string),
        location: formData.get('location') as string,
        region: formData.get('region') as any,
        is_public: formData.get('is_public') === 'true',
        image: formData.get('image') as File,
    };

    const parsedData = eventFormSchema.safeParse(values);

    if (!parsedData.success) {
        console.error('Event validation error:', parsedData.error.flatten().fieldErrors);
        return { error: "Dados do evento inválidos." };
    }
    
    const { id, confraria_id, name, description, event_date, location, region, image, is_public } = parsedData.data;

    // Check permissions before upserting
    await checkPermissions(confraria_id);
    
    let imageUrl: string | undefined | null = formData.get('current_image_url') as string;

    if (image && image.size > 0) {
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
        event_date: event_date.toISOString(),
        location: location || null,
        region,
        image_url: imageUrl || 'https://placehold.co/600x400.png',
        image_hint: 'event placeholder',
        is_public,
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

    if (image && image.size > 0) {
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
    
    if (image && image.size > 0) {
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

export async function addGalleryImage(formData: FormData) {
    'use server';
    const supabaseService = createServiceRoleClient();

    const values = {
        confraria_id: Number(formData.get('confraria_id')),
        description: formData.get('description') as string,
        image: formData.get('image') as File,
    };

    const parsedData = galleryImageSchema.safeParse(values);
    if (!parsedData.success || !parsedData.data.image || parsedData.data.image.size === 0) {
        return { error: 'Dados da imagem inválidos ou imagem em falta.' };
    }

    const { confraria_id, description, image } = parsedData.data;

    await checkPermissions(confraria_id);

    const fileExtension = image.name.split('.').pop();
    const fileName = `gallery/${confraria_id}/${nanoid()}.${fileExtension}`;

    const { error: uploadError } = await supabaseService.storage
        .from('public-images')
        .upload(fileName, image);

    if (uploadError) {
        console.error('Error uploading gallery image:', uploadError);
        return { error: 'Não foi possível carregar a imagem.' };
    }

    const { data: { publicUrl } } = supabaseService.storage.from('public-images').getPublicUrl(fileName);
    
    const { error: dbError } = await supabaseService.from('confraria_gallery_images').insert({
        confraria_id,
        image_url: publicUrl,
        description: description || null,
    });

    if (dbError) {
        // Optional: delete the uploaded file if DB insert fails
        await supabaseService.storage.from('public-images').remove([fileName]);
        console.error("Error saving gallery image to DB:", dbError);
        return { error: `Erro ao guardar a imagem: ${dbError.message}` };
    }

    revalidatePath(`/confrarias/${confraria_id}`);
    revalidatePath(`/confrarias/${confraria_id}/manage`);

    return { success: true, message: 'Imagem adicionada à galeria!' };
}

export async function deleteGalleryImage(id: number, confrariaId: number) {
    'use server';
    await checkPermissions(confrariaId);
    const { error } = await createServiceRoleClient().from('confraria_gallery_images').delete().eq('id', id);
    if (error) return { error: 'Erro ao apagar imagem.' };
    revalidatePath(`/confrarias/${confrariaId}/manage`);
    return { success: true, message: 'Imagem removida.' };
}


export async function updateConfrariaImage(formData: FormData) {
    'use server';

    const confraria_id_raw = formData.get('confraria_id');
    const type_raw = formData.get('type');
    const image_raw = formData.get('image');
    
    if (!confraria_id_raw || !type_raw || !image_raw || !(image_raw instanceof File) || image_raw.size === 0) {
        return { error: "Dados inválidos ou imagem em falta." };
    }
    
    const confraria_id = Number(confraria_id_raw);
    const type = type_raw as 'seal_url' | 'cover_url';
    const image = image_raw;

    await checkPermissions(confraria_id);
    
    const supabaseService = createServiceRoleClient();
    
    const fileExtension = image.name.split('.').pop();
    const fileName = `confrarias/${confraria_id}/${type === 'seal_url' ? 'selo' : 'capa'}-${nanoid()}.${fileExtension}`;
    
    const { error: uploadError } = await supabaseService.storage
        .from('public-images')
        .upload(fileName, image, {
            cacheControl: '3600',
            upsert: true,
        });

    if (uploadError) {
        console.error(`Error uploading ${type} image:`, uploadError);
        return { error: 'Não foi possível carregar a imagem.' };
    }

    const { data: { publicUrl } } = supabaseService.storage.from('public-images').getPublicUrl(fileName);

    const { error: dbError } = await supabaseService
        .from('confrarias')
        .update({ [type]: publicUrl })
        .eq('id', confraria_id);

    if (dbError) {
        console.error(`Error updating confraria ${type}:`, dbError);
        return { error: 'Não foi possível atualizar a imagem da confraria.' };
    }

    revalidatePath(`/confrarias/${confraria_id}`);
    revalidatePath(`/confrarias/${confraria_id}/manage`);

    return { success: true, message: "Imagem atualizada com sucesso!" };
}
