
import { createServerClient } from '@/lib/supabase/server';
import { notFound, redirect } from 'next/navigation';
import { ManageConfrariaForm } from './edit-form';

async function getConfraria(id: number, userId: string) {
    const supabase = createServerClient();
    const { data, error } = await supabase
        .from('confrarias')
        .select('*')
        .eq('id', id)
        .single();

    if (error || !data) {
        console.error("Error fetching confraria for management", error);
        notFound();
    }

    // Security check: ensure the logged-in user is the responsible user
    if (data.responsible_user_id !== userId) {
        console.warn(`User ${userId} tried to manage confraria ${id} without permission.`);
        redirect(`/confrarias/${id}`);
    }
    
    return {
      id: data.id,
      name: data.name,
      motto: data.motto,
      history: data.history ?? '',
      founders: data.founders ?? '',
    };
}


export default async function ManageConfrariaPage({ params }: { params: { confrariaId: string } }) {
    const supabase = createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    const confrariaId = parseInt(params.confrariaId, 10);
    if (isNaN(confrariaId)) {
        notFound();
    }
    
    const confrariaData = await getConfraria(confrariaId, user.id);

    return (
        <ManageConfrariaForm confraria={confrariaData} />
    );
}

