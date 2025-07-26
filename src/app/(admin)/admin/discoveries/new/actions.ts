
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
  title: z.string().min(3, 'O título deve ter pelo menos 3 caracteres.'),
  description: z.string().min(3, 'A descrição curta deve ter pelo menos 3 caracteres.'),
  editorial: z.string().min(10, 'O editorial deve ter pelo menos 10 caracteres.'),
  region: z.enum(regions),
  type: z.string({ required_error: 'Por favor, selecione um tipo.'}),
  confraria_id: z.string().optional(),
  image_url: z.string().url().optional().or(z.literal('')),
  image_hint: z.string().optional(),
  address: z.string().optional(),
  website: z.string().url().optional().or(z.literal('')),
  phone: z.string().optional(),
});

export async function createDiscovery(values: z.infer<typeof formSchema>) {
    await checkAdmin();

    const parsedData = formSchema.safeParse(values);

    if (!parsedData.success) {
        console.error("Validation errors:", parsedData.error.errors);
        return { error: "Dados inválidos." };
    }

    const { title, confraria_id, type, ...rest } = parsedData.data;

    const slug = title.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');

    const supabase = createServiceRoleClient();

    const { error } = await supabase
        .from('discoveries')
        .insert({
            title,
            slug,
            type: parseInt(type, 10),
            confraria_id: confraria_id && confraria_id !== 'null' ? parseInt(confraria_id, 10) : null,
            ...rest
        });

    if (error) {
        console.error("Error creating discovery:", error);
        return { error: `Erro ao criar descoberta: ${error.message}` };
    }

    revalidatePath('/admin/dashboard');
    revalidatePath('/discoveries');
    
    redirect('/admin/dashboard');
}
