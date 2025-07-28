'use server';

import { createServerClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';

export async function toggleSeal(formData: FormData) {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return redirect('/login');
  }

  const discoveryId = formData.get('discoveryId');
  const hasSealed = formData.get('hasSealed') === 'true';
  const slug = formData.get('slug') as string;

  if (!discoveryId) {
    console.error('Discovery ID is missing');
    return;
  }

  if (hasSealed) {
    // Remover o selo
    const { error } = await supabase
      .from('seals')
      .delete()
      .match({ user_id: user.id, discovery_id: discoveryId });

    if (error) {
      console.error('Error removing seal:', error);
    }
  } else {
    // Adicionar o selo
    const { error } = await supabase
      .from('seals')
      .insert({ user_id: user.id, discovery_id: Number(discoveryId) });

    if (error) {
      console.error('Error adding seal:', error);
    }
  }

  revalidatePath(`/discoveries/${slug}`);
  revalidatePath('/discoveries');
  revalidatePath('/profile');
}


const testimonialSchema = z.object({
  content: z.string().min(10, 'O testemunho deve ter pelo menos 10 caracteres.'),
  discoveryId: z.string(),
});

export async function addTestimonial(formData: FormData) {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  const content = formData.get('content') as string;
  const discoveryId = formData.get('discoveryId') as string;
  const slug = formData.get('slug') as string;

  if (!user) {
    return { error: 'Tem de estar autenticado para deixar um testemunho.' };
  }

  const parsedData = testimonialSchema.safeParse({ content, discoveryId });
  if (!parsedData.success) {
    return { error: parsedData.error.errors.map(e => e.message).join(', ') };
  }

  const { error } = await supabase.from('testimonials').insert({
    content,
    discovery_id: Number(discoveryId),
    user_id: user.id,
  });

  if (error) {
    console.error('Error adding testimonial:', error);
    if (error.code === '23505') {
      return { error: 'Você já deixou um testemunho nesta descoberta.' };
    }
    return { error: 'Ocorreu um erro ao guardar o seu testemunho.' };
  }

  revalidatePath(`/discoveries/${slug}`);
  return { success: true };
}


export async function deleteTestimonial(formData: FormData) {
    const supabase = createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    const testimonialId = Number(formData.get('testimonialId'));
    const slug = formData.get('slug') as string;

    if (!user) {
        return { error: 'Não autorizado.' };
    }
    if (!testimonialId) {
        return { error: 'ID do testemunho em falta.' };
    }

    // RLS policy will ensure users can only delete their own testimonials.
    const { error } = await supabase
        .from('testimonials')
        .delete()
        .eq('id', testimonialId);
    
    if (error) {
        console.error("Error deleting testimonial:", error);
        return { error: 'Ocorreu um erro ao apagar o testemunho.' };
    }

    revalidatePath(`/discoveries/${slug}`);
    return { success: true };
}
