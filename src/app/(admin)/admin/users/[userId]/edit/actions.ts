
'use server';

import { z } from 'zod';
import { createServerClient } from '@/lib/supabase/server';
import { createServiceRoleClient } from '@/lib/supabase/service';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { ranks } from '@/lib/data';

async function checkAdmin() {
  const supabase = createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || user.email !== process.env.ADMIN_EMAIL) {
    throw new Error('Not authorized');
  }
}

const rankNames = ranks.map(r => r.name);

const formSchema = z.object({
  id: z.string(),
  full_name: z.string().min(3, 'O nome deve ter pelo menos 3 caracteres.'),
  rank_override: z.string().optional(),
});

export async function updateUser(values: z.infer<typeof formSchema>) {
    await checkAdmin();

    const parsedData = formSchema.safeParse(values);

    if (!parsedData.success) {
        console.error("Validation errors:", parsedData.error.errors);
        return { error: "Dados inválidos." };
    }
    
    const { id, full_name, rank_override } = parsedData.data;

    const supabase = createServiceRoleClient();

    const { error } = await supabase.auth.admin.updateUserById(id, {
        user_metadata: { 
            full_name: full_name,
            rank_override: rank_override === 'none' ? null : rank_override
        }
    });

    if (error) {
        console.error("Error updating user:", error);
        return { error: `Erro ao atualizar utilizador: ${error.message}` };
    }

    revalidatePath('/admin/users');
    revalidatePath(`/admin/users/${id}/edit`);
    redirect('/admin/users');
}


export async function deleteUser(userId: string) {
    await checkAdmin();
    const supabase = createServiceRoleClient();

    const { error } = await supabase.auth.admin.deleteUser(userId);

    if (error) {
        console.error('Error deleting user:', error);
        return { error: 'Ocorreu um erro ao apagar o utilizador.' };
    }
    
    revalidatePath('/admin/users');
    redirect('/admin/users');
}
