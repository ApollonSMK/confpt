
'use server';

import { z } from 'zod';
import { createServerClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { createServiceRoleClient } from '@/lib/supabase/service';

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
  is_public: z.boolean().default(true),
  image_url: z.string().url('URL inválido.').optional().or(z.literal('')),
  image_hint: z.string().optional(),
  image: z.any().optional(), // for the file upload
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

export async function upsertEvent(values: z.infer<typeof eventFormSchema>) {
    const supabase = createServerClient();
    const parsedData = eventFormSchema.safeParse(values);

    if (!parsedData.success) {
        console.error('Validation Error', parsedData.error);
        return { error: "Dados do evento inválidos." };
    }
    
    const { id, confraria_id, name, description, event_date, location, image_url, image_hint, is_public } = parsedData.data;

    // Check permissions before upserting
    await checkPermissions(confraria_id, supabase);
    
    const eventData = {
        confraria_id,
        name,
        description: description || null,
        event_date: event_date.toISOString(),
        location: location || null,
        image_url: image_url || 'https://placehold.co/600x400.png',
        image_hint: image_hint || 'event placeholder',
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

    return { success: true, message: id ? "Evento atualizado!" : "Evento criado!" };
}
