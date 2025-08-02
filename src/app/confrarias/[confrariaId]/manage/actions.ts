
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


async function checkPermissions(confrariaId: number, supabaseClient: any) {
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
        throw new Error('Not authenticated');
    }

    const { data: confraria, error } = await supabaseClient
        .from('confrarias')
        .select('responsible_user_id')
        .eq('id', confrariaId)
        .single();
    
    if (error) throw new Error('Confraria not found');

    const { data: { session } } = await supabaseClient.auth.getSession();
    const isAdmin = session?.user.email === process.env.ADMIN_EMAIL;
    const isResponsible = confraria.responsible_user_id === user.id;

    if (!isAdmin && !isResponsible) {
        throw new Error('Not authorized');
    }
    return user;
}


export async function updateConfrariaDetails(values: z.infer<typeof detailsFormSchema>) {
    const supabase = createServerClient();
    
    const parsedData = detailsFormSchema.safeParse(values);

    if (!parsedData.success) {
        return { error: "Dados inválidos." };
    }
    
    const { id, motto, history, founders } = parsedData.data;

    await checkPermissions(id, supabase);

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


export async function handleMembershipAction(formData: FormData) {
    'use server';
    const supabase = createServiceRoleClient(); // Use service client for elevated privileges
    const serverClient = createServerClient();

    const membershipId = Number(formData.get('membershipId'));
    const confrariaId = Number(formData.get('confrariaId'));
    const action = formData.get('action'); // 'approve' or 'reject'

    if (!membershipId || !confrariaId || !action) {
        return { error: 'Dados inválidos.' };
    }
    
    // Check if the current user has permission to manage this confraria
    await checkPermissions(confrariaId, serverClient);

    if (action === 'approve') {
        const { error } = await supabase
            .from('confraria_members')
            .update({ status: 'approved' })
            .eq('id', membershipId);
        
        if (error) {
            console.error('Error approving member:', error);
            return { error: 'Erro ao aprovar membro.' };
        }
    } else if (action === 'reject') {
        const { error } = await supabase
            .from('confraria_members')
            .delete()
            .eq('id', membershipId);
        
        if (error) {
            console.error('Error rejecting member:', error);
            return { error: 'Erro ao rejeitar membro.' };
        }
    }

    revalidatePath(`/confrarias/${confrariaId}`);
    revalidatePath(`/confrarias/${confrariaId}/manage`);

    return { success: true };
}

export async function upsertEvent(formData: FormData) {
    const supabase = createServerClient();
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
    await checkPermissions(confraria_id, supabase);
    
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
        const { error: updateError } = await supabase
            .from('events')
            .update(eventData)
            .eq('id', id);
        error = updateError;
    } else {
        // Create new event
        const { error: insertError } = await supabase
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

    const supabase = createServerClient();
    const supabaseService = createServiceRoleClient();
    
    const values = {
        id: formData.get('id') ? Number(formData.get('id')) : undefined,
        confraria_id: Number(formData.get('confraria_id')),
        author_id: formData.get('author_id') as string,
        title: formData.get('title') as string,
        content: formData.get('content') as string,
        image: formData.get('image') as File,
        status: formData.get('status') as 'draft' | 'published',
    };

    const parsedData = articleSchema.safeParse(values);
    if (!parsedData.success) {
        console.error('Article validation error', parsedData.error);
        return { error: 'Dados do artigo inválidos.' };
    }

    const { id, confraria_id, author_id, title, content, image, status } = parsedData.data;

    await checkPermissions(confraria_id, supabase);

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

    const articleData = {
        confraria_id,
        author_id,
        title,
        content,
        status,
        slug: id ? undefined : slug, // only set slug on creation
        image_url: imageUrl,
        image_hint: 'article cover',
        published_at: status === 'published' && !id ? new Date().toISOString() : undefined, // set publish date only on first publish
    };
    
    // Don't overwrite published_at if article is already published and we're just saving a draft
    if (id && status === 'published') {
        const { data: existingArticle } = await supabase.from('articles').select('published_at').eq('id', id).single();
        if (!existingArticle?.published_at) {
            articleData.published_at = new Date().toISOString();
        } else {
             delete (articleData as any).published_at;
        }
    }


    let error;
    if (id) {
        const { error: updateError } = await supabase
            .from('articles')
            .update(articleData)
            .eq('id', id);
        error = updateError;
    } else {
        const { error: insertError } = await supabase
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


export async function removeMember(formData: FormData) {
    'use server';
    const supabase = createServiceRoleClient(); // Use service client for elevated privileges
    const serverClient = createServerClient();

    const membershipId = Number(formData.get('membershipId'));
    const confrariaId = Number(formData.get('confrariaId'));
    
    if (!membershipId || !confrariaId) {
        return { error: 'Dados inválidos.' };
    }
    
    await checkPermissions(confrariaId, serverClient);
    
    const { error } = await supabase
        .from('confraria_members')
        .delete()
        .eq('id', membershipId);
        
    if (error) {
        console.error('Error removing member:', error);
        return { error: 'Erro ao remover membro.' };
    }
    
    revalidatePath(`/confrarias/${confrariaId}`);
    revalidatePath(`/confrarias/${confrariaId}/manage`);

    return { success: true, message: 'Membro removido com sucesso.' };
}
