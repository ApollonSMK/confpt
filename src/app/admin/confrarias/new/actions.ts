
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

const confrariaSchema = z.object({
  name: z.string().min(3, 'O nome deve ter pelo menos 3 caracteres.'),
  motto: z.string().min(5, 'O lema deve ter pelo menos 5 caracteres.'),
  region: z.enum(regions, { required_error: 'Por favor, selecione uma região.'}),
  seal_url: z.string().url('Por favor, insira um URL válido para o selo.'),
  seal_hint: z.string().min(2, 'O hint deve ter pelo menos 2 caracteres.'),
});

export async function createConfraria(values: z.infer<typeof confrariaSchema>) {
    await checkAdmin();

    const parsedData = confrariaSchema.safeParse(values);

    if (!parsedData.success) {
        console.error("Validation errors:", parsedData.error.errors);
        return { error: "Dados inválidos." };
    }

    const { name, motto, region, seal_url, seal_hint } = parsedData.data;

    const supabase = createServiceRoleClient();

    const { error } = await supabase
        .from('confrarias')
        .insert({
            name,
            motto,
            region,
            seal_url,
            seal_hint,
        });

    if (error) {
        console.error("Error creating confraria:", error);
        return { error: `Erro ao criar confraria: ${error.message}` };
    }

    revalidatePath('/admin/dashboard');
    revalidatePath('/confrarias');
    
    redirect('/admin/dashboard');
}
