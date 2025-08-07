

'use server';

import { z } from 'zod';
import { createServerClient } from '@/lib/supabase/server';
import { createServiceRoleClient } from '@/lib/supabase/service';
import { districts } from '@/lib/data';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { nanoid } from 'nanoid';

async function checkAdmin() {
  const supabase = createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || user.email !== process.env.ADMIN_EMAIL) {
    throw new Error('Not authorized');
  }
}

const amenitySchema = z.object({
  id: z.string(),
  label: z.string(),
  icon: z.string(),
});

const formSchema = z.object({
  id: z.number(),
  title: z.string().min(3, 'O título deve ter pelo menos 3 caracteres.'),
  description: z.string().min(3, 'A descrição curta deve ter pelo menos 3 caracteres.'),
  editorial: z.string().min(10, 'O editorial deve ter pelo menos 10 caracteres.'),
  district: z.enum(districts),
  municipality: z.string({ required_error: 'Por favor, selecione um concelho.'}),
  type_id: z.string({ required_error: 'Por favor, selecione um tipo.'}),
  confraria_id: z.string().optional(),
  address: z.string().optional(),
  website: z.string().url().optional().or(z.literal('')),
  phone: z.string().optional(),
  amenities: z.array(amenitySchema).optional(),
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

    redirect('/admin/discoveries');
}


export async function addDiscoveryImage(formData: FormData) {
    'use server';

    const discoveryId = Number(formData.get('discoveryId'));
    const image = formData.get('image') as File;
    const imageHint = formData.get('imageHint') as string;
    const slug = formData.get('slug') as string;

    if (!image || image.size === 0) {
        return { error: 'Nenhuma imagem selecionada.' };
    }

    await checkAdmin();
    const supabaseService = createServiceRoleClient();

    const fileExtension = image.name.split('.').pop();
    const fileName = `discoveries/${discoveryId}/${nanoid()}.${fileExtension}`;

    const { error: uploadError } = await supabaseService.storage
        .from('public-images')
        .upload(fileName, image);

    if (uploadError) {
        console.error(`Error uploading gallery image:`, uploadError);
        return { error: `Falha ao carregar a imagem.` };
    }

    const { data: { publicUrl } } = supabaseService.storage.from('public-images').getPublicUrl(fileName);

    const { error: dbError } = await supabaseService
        .from('discovery_images')
        .insert({
            discovery_id: discoveryId,
            image_url: publicUrl,
            image_hint: imageHint || 'discovery gallery image'
        });
    
    if (dbError) {
        console.error("Error saving gallery image to DB:", dbError);
        // Clean up stored file
        await supabaseService.storage.from('public-images').remove([fileName]);
        return { error: `Erro ao guardar a imagem na galeria.` };
    }

    revalidatePath(`/admin/discoveries/${discoveryId}/edit`);
    revalidatePath(`/discoveries/${slug}`);

    return { success: true, message: 'Imagem adicionada à galeria!' };
}

export async function deleteDiscoveryImage(imageId: number, discoveryId: number, slug: string) {
    'use server';
    await checkAdmin();

    const supabase = createServiceRoleClient();
    
    const { data: image, error: fetchError } = await supabase
        .from('discovery_images')
        .select('image_url')
        .eq('id', imageId)
        .single();
    
    if (fetchError || !image) {
        return { error: 'Imagem não encontrada.'};
    }

    const { error: deleteDbError } = await supabase
        .from('discovery_images')
        .delete()
        .eq('id', imageId);
    
    if (deleteDbError) {
        return { error: 'Erro ao apagar a imagem da galeria.' };
    }

    // Delete file from storage
    const filePath = image.image_url.substring(image.image_url.lastIndexOf(`discoveries/`));
    await supabase.storage.from('public-images').remove([filePath]);
    
    revalidatePath(`/admin/discoveries/${discoveryId}/edit`);
    revalidatePath(`/discoveries/${slug}`);

    return { success: true };
}
