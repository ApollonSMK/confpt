
'use server';

import { z } from 'zod';
import { createServerClient } from '@/lib/supabase/server';
import { createServiceRoleClient } from '@/lib/supabase/service';
import { revalidatePath } from 'next/cache';

async function checkAdmin() {
  const supabase = createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || user.email !== process.env.ADMIN_EMAIL) {
    throw new Error('Not authorized');
  }
}

const typeSchema = z.object({
  name: z.string().min(2, 'O nome do tipo deve ter pelo menos 2 caracteres.'),
});

export async function createType(values: z.infer<typeof typeSchema>) {
    await checkAdmin();

    const parsedData = typeSchema.safeParse(values);

    if (!parsedData.success) {
        return { error: "Dados inválidos." };
    }

    const supabase = createServiceRoleClient();

    const { error } = await supabase
        .from('discovery_types')
        .insert({ name: parsedData.data.name });

    if (error) {
        if (error.code === '23505') { // unique constraint violation
            return { error: 'Este tipo já existe.' };
        }
        console.error("Error creating discovery type:", error);
        return { error: `Erro ao criar tipo: ${error.message}` };
    }

    revalidatePath('/admin/types');
    return { success: true };
}

export async function deleteType(id: number) {
    await checkAdmin();

    const supabase = createServiceRoleClient();
    
    // First, check if this type is being used by any discovery
    const { count, error: countError } = await supabase
        .from('discoveries')
        .select('*', { count: 'exact', head: true })
        .eq('type_id', id);

    if (countError) {
        console.error('Error checking type usage:', countError);
        return { error: 'Não foi possível verificar o uso deste tipo.' };
    }

    if (count !== null && count > 0) {
        return { error: `Este tipo está a ser usado por ${count} descoberta(s) e não pode ser apagado.` };
    }

    // If not used, proceed with deletion
    const { error } = await supabase
        .from('discovery_types')
        .delete()
        .eq('id', id);

    if (error) {
        console.error('Error deleting discovery type:', error);
        return { error: 'Ocorreu um erro ao apagar o tipo.' };
    }

    revalidatePath('/admin/types');
    return { success: true };
}
