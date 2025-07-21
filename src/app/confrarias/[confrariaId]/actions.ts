
'use server';

import { createServerClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export async function toggleMembershipRequest(formData: FormData) {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  const confrariaId = formData.get('confrariaId');
  const hasRequested = formData.get('hasRequested') === 'true';

  if (!user) {
    return redirect(`/login?redirect=/confrarias/${confrariaId}`);
  }

  if (!confrariaId) {
    console.error('Confraria ID is missing');
    return { error: 'ID da Confraria em falta.' };
  }

  if (hasRequested) {
    // Cancelar o pedido de adesão (DELETE)
    const { error } = await supabase
      .from('confraria_members')
      .delete()
      .match({ user_id: user.id, confraria_id: confrariaId, status: 'pending' });

    if (error) {
      console.error('Error cancelling membership request:', error);
      return { error: 'Ocorreu um erro ao cancelar o pedido.' };
    }
  } else {
    // Criar um novo pedido de adesão (INSERT)
    const { error } = await supabase
      .from('confraria_members')
      .insert({
        user_id: user.id,
        confraria_id: Number(confrariaId),
        status: 'pending',
      });

    if (error) {
      console.error('Error creating membership request:', error);
      if (error.code === '23505') { // unique_violation
          return { error: 'Você já tem um pedido de adesão para esta confraria.' };
      }
      return { error: 'Ocorreu um erro ao solicitar a adesão.' };
    }
  }

  revalidatePath(`/confrarias/${confrariaId}`);
  return { success: true };
}
