
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

// We don't need discoveryTypes here anymore, as it will be fetched from DB
const formSchema = z.object({
  id: z.number(),
  title: z.string().min(3, 'O título deve ter pelo menos 3 caracteres.'),
  description: z.string().min(3, 'A descrição curta deve ter pelo menos 3 caracteres.'),
  editorial: z.string().min(10, 'O editorial deve ter pelo menos 10 caracteres.'),
  region: z.enum(regions),
  type_id: z.string({ required_error: 'Por favor, selecione um tipo.'}),
  confraria_id: z.string().optional(),
  image_url: z.string().url().optional().or(z.literal('')),
  image_hint: z.string().optional(),
  address: z.string().optional(),
  website: z.string().url().optional().or(z.literal('')),
  phone: z.string().optional(),
  latitude: z.coerce.number().optional(),
  longitude: z.coerce.number().optional(),
});

export async function updateDiscovery(values: z.infer<typeof formSchema>) {
    await checkAdmin();

    const parsedData = formSchema.safeParse(values);

    if (!parsedData.success) {
        console.error("Validation errors:", parsedData.error.errors);
        return { error: "Dados inválidos." };
    }
    
    const { id, title, confraria_id, type_id, ...rest } = parsedData.data;

    const slug = title.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');

    const supabase = createServiceRoleClient();

    const { error } = await supabase
        .from('discoveries')
        .update({
            title,
            slug,
            type_id: parseInt(type_id, 10),
            confraria_id: confraria_id && confraria_id !== 'null' ? parseInt(confraria_id, 10) : null,
            ...rest
        })
        .eq('id', id);

    if (error) {
        console.error("Error updating discovery:", error);
        return { error: `Erro ao atualizar descoberta: ${error.message}` };
    }

    revalidatePath('/admin/discoveries');
    revalidatePath(`/discoveries/${slug}`);
    revalidatePath('/map');
    
    redirect('/admin/discoveries');
}

export async function deleteDiscovery(id: number) {
    await checkAdmin();

    const supabase = createServiceRoleClient();
    const { error } = await supabase.from('discoveries').delete().eq('id', id);

    if (error) {
        console.error('Error deleting discovery:', error);
        return { error: 'Ocorreu um erro ao apagar a descoberta.' };
    }

    revalidatePath('/admin/dashboard');
    revalidatePath('/admin/discoveries');
    revalidatePath('/discoveries');
    revalidatePath('/map');

    redirect('/admin/discoveries');
}
