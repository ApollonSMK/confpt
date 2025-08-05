
'use server';

import { z } from 'zod';
import { createServerClient } from '@/lib/supabase/server';
import { createServiceRoleClient } from '@/lib/supabase/service';
import { districts } from '@/lib/data';
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
  district: z.enum(districts),
  type_id: z.string({ required_error: 'Por favor, selecione um tipo.'}),
  confraria_id: z.string().optional(),
  image_url: z.string().url("A URL da imagem é inválida.").optional().or(z.literal('')),
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

    const { title, confraria_id, type_id, image_url, image_hint, district, ...rest } = parsedData.data;

    const slug = title.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');

    const supabase = createServiceRoleClient();

    // Insert into discoveries table first
    const { data: discoveryData, error: discoveryError } = await supabase
        .from('discoveries')
        .insert({
            title,
            slug,
            district,
            type_id: parseInt(type_id, 10),
            confraria_id: confraria_id && confraria_id !== 'null' ? parseInt(confraria_id, 10) : null,
            ...rest
        })
        .select('id')
        .single();

    if (discoveryError) {
        console.error("Error creating discovery:", discoveryError);
        return { error: `Erro ao criar descoberta: ${discoveryError.message}` };
    }

    // Now, insert the image into the new discovery_images table
    if (image_url) {
        const { error: imageError } = await supabase
            .from('discovery_images')
            .insert({
                discovery_id: discoveryData.id,
                image_url: image_url,
                image_hint: image_hint,
                sort_order: 0,
            });
        
        if (imageError) {
            console.error("Error adding discovery image:", imageError);
            // Optionally, we could delete the discovery here for consistency, but for now we'll just log it.
            return { error: `Descoberta criada, mas falha ao adicionar imagem: ${imageError.message}` };
        }
    }


    revalidatePath('/admin/dashboard');
    revalidatePath('/discoveries');
    
    redirect('/admin/discoveries');
}
