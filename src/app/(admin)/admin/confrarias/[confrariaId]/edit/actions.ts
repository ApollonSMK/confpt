
'use server';

import { z } from 'zod';
import { createServerClient } from '@/lib/supabase/server';
import { createServiceRoleClient } from '@/lib/supabase/service';
import { regions } from '@/lib/data';
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
  id: z.number(),
  name: z.string().min(3, 'O nome deve ter pelo menos 3 caracteres.'),
  motto: z.string().min(5, 'O lema deve ter pelo menos 5 caracteres.'),
  region: z.enum(regions, { required_error: 'Por favor, selecione uma região.'}),
  seal_url: z.string().url('Por favor, insira um URL válido para o selo.'),
  seal_hint: z.string().min(2, 'O hint deve ter pelo menos 2 caracteres.'),
  responsible_email: z.string().email("Por favor, insira um email válido para o responsável.").optional().or(z.literal('')),
});

export async function updateConfraria(values: z.infer<typeof formSchema>) {
    await checkAdmin();

    const parsedData = formSchema.safeParse(values);

    if (!parsedData.success) {
        console.error("Validation errors:", parsedData.error.errors);
        return { error: "Dados inválidos." };
    }
    
    const { id, name, motto, region, seal_url, seal_hint, responsible_email } = parsedData.data;

    const supabase = createServiceRoleClient();

    let responsibleUserId: string | null = null;
    if (responsible_email) {
        // We need to use the service client to look up users by email
        const { data: usersData, error: usersError } = await supabase.auth.admin.listUsers({ email: responsible_email });
        
        if (usersError || !usersData.users || usersData.users.length === 0) {
            console.error("User not found for email:", responsible_email, usersError);
            return { error: `Utilizador com o email ${responsible_email} não encontrado.`};
        }
        responsibleUserId = usersData.users[0].id;
    }

    const { error } = await supabase
        .from('confrarias')
        .update({
            name,
            motto,
            region,
            seal_url,
            seal_hint,
            responsible_user_id: responsibleUserId,
        })
        .eq('id', id);

    if (error) {
        console.error("Error updating confraria:", error);
        return { error: `Erro ao atualizar confraria: ${error.message}` };
    }

    revalidatePath('/admin/dashboard');
    revalidatePath('/admin/confrarias');
    revalidatePath(`/confrarias/${id}`);
    
    redirect('/admin/confrarias');
}

export async function deleteConfraria(id: number) {
    await checkAdmin();

    const supabase = createServiceRoleClient();
    const { error } = await supabase.from('confrarias').delete().eq('id', id);

    if (error) {
        console.error('Error deleting confraria:', error);
        return { error: 'Ocorreu um erro ao apagar a confraria.' };
    }

    revalidatePath('/admin/dashboard');
    revalidatePath('/admin/confrarias');
    revalidatePath('/confrarias');

    // This was the missing piece. We must redirect after deletion.
    redirect('/admin/confrarias');
}
