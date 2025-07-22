
'use server';

import { z } from 'zod';
import { createServerClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createServiceRoleClient } from '@/lib/supabase/service';

const formSchema = z.object({
  id: z.number(),
  motto: z.string().min(5, 'O lema deve ter pelo menos 5 caracteres.'),
  history: z.string().optional(),
  founders: z.string().optional(),
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

    const isAdmin = user.email === process.env.ADMIN_EMAIL;
    const isResponsible = confraria.responsible_user_id === user.id;

    if (!isAdmin && !isResponsible) {
        throw new Error('Not authorized');
    }
    return user;
}


export async function updateConfrariaDetails(values: z.infer<typeof formSchema>) {
    const supabase = createServerClient();
    
    const parsedData = formSchema.safeParse(values);

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
    
    return { success: true };
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

    