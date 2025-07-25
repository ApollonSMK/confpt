
'use server';

import { z } from 'zod';
import { createServerClient } from '@/lib/supabase/server';
import { createServiceRoleClient } from '@/lib/supabase/service';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

async function checkAdmin() {
  const supabase = createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || user.email !== process.env.ADMIN_EMAIL) {
    throw new Error('Not authorized');
  }
}

const formSchema = z.object({
  id: z.string(),
  full_name: z.string().min(3, 'O nome deve ter pelo menos 3 caracteres.'),
  // Adicionar mais campos aqui no futuro, como role, etc.
});

export async function updateUser(values: z.infer<typeof formSchema>) {
    await checkAdmin();

    const parsedData = formSchema.safeParse(values);

    if (!parsedData.success) {
        console.error("Validation errors:", parsedData.error.errors);
        return { error: "Dados inválidos." };
    }
    
    const { id, full_name } = parsedData.data;

    const supabase = createServiceRoleClient();

    const { error } = await supabase.auth.admin.updateUserById(id, {
        user_metadata: { full_name: full_name }
    });


    if (error) {
        console.error("Error updating user:", error);
        return { error: `Erro ao atualizar utilizador: ${error.message}` };
    }

    revalidatePath('/admin/users');
    redirect('/admin/users');
}
