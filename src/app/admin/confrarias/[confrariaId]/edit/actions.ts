
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
    redirect('/login');
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
        const { data: userData, error: userError } = await supabase.from('users').select('id').eq('email', responsible_email).single();
        if (userError || !userData) {
            console.error("User not found for email:", responsible_email, userError);
            return { error: `Utilizador com o email ${responsible_email} não encontrado.`};
        }
        responsibleUserId = userData.id;
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
    revalidatePath(`/confrarias/${id}`);
    
    redirect('/admin/dashboard');
}
