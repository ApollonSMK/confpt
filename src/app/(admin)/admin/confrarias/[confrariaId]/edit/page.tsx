
import { createServiceRoleClient } from '@/lib/supabase/service';
import { createServerClient } from '@/lib/supabase/server';
import { notFound, redirect } from 'next/navigation';
import { EditConfrariaForm } from './edit-form';

async function checkAdmin() {
  const supabase = createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || user.email !== process.env.ADMIN_EMAIL) {
    redirect('/login');
  }
}

async function getConfraria(id: number) {
    const supabase = createServiceRoleClient();
    const { data, error } = await supabase.from('confrarias').select('*').eq('id', id).single();

    if (error || !data) {
        console.error("Error fetching confraria for edit", error);
        notFound();
    }

    let responsible_email = '';
    if (data.responsible_user_id) {
        // We need to use the service client to get user data from auth.users
        const { data: user, error: userError } = await supabase.auth.admin.getUserById(data.responsible_user_id);
        
        if (user?.user) {
            responsible_email = user.user.email || '';
        } else {
            console.warn("Could not fetch responsible user email:", userError);
        }
    }
    
    return {
      id: data.id,
      name: data.name,
      motto: data.motto,
      district: data.district,
      municipality: data.municipality,
      seal_url: data.seal_url,
      seal_hint: data.seal_hint,
      responsible_email: responsible_email || '',
    };
}


export default async function EditConfrariaPage({ params }: { params: { confrariaId: string } }) {
    await checkAdmin();
    const confrariaId = parseInt(params.confrariaId, 10);
    if (isNaN(confrariaId)) {
        notFound();
    }
    
    const confrariaData = await getConfraria(confrariaId);

    return (
        <EditConfrariaForm confraria={confrariaData} />
    );
}
