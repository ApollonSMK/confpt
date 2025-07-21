
'use server';

import { z } from 'zod';
import { createServerClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

const formSchema = z.object({
  id: z.number(),
  motto: z.string().min(5, 'O lema deve ter pelo menos 5 caracteres.'),
  history: z.string().optional(),
  founders: z.string().optional(),
});

export async function updateConfrariaDetails(values: z.infer<typeof formSchema>) {
    const supabase = createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { error: 'Utilizador não autenticado.' };
    }

    const parsedData = formSchema.safeParse(values);

    if (!parsedData.success) {
        return { error: "Dados inválidos." };
    }
    
    const { id, motto, history, founders } = parsedData.data;

    // A Row Level Security policy no Supabase vai garantir que apenas
    // o `responsible_user_id` pode fazer esta atualização.
    // A query na `page.tsx` também faz uma verificação prévia.
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
    
    // Não redirecionamos aqui para a toast ser visível.
    // O redirecionamento será feito no lado do cliente.
    return { success: true };
}
