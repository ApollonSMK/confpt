'use server';

import { createServerClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

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
      .insert({ user_id: user.id, discovery_id: discoveryId });

    if (error) {
      console.error('Error adding seal:', error);
    }
  }

  revalidatePath(`/discoveries/${slug}`);
  revalidatePath('/discoveries');
}
