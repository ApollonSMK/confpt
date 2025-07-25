
import { createServiceRoleClient } from '@/lib/supabase/service';
import { createServerClient } from '@/lib/supabase/server';
import { notFound, redirect } from 'next/navigation';
import { EditDiscoveryForm } from './edit-form';
import type { Confraria, Discovery } from '@/lib/data';

async function checkAdmin() {
  const supabase = createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || user.email !== process.env.ADMIN_EMAIL) {
    redirect('/login');
  }
}

async function getDiscovery(id: number): Promise<Discovery> {
    const supabase = createServiceRoleClient();
    const { data, error } = await supabase.from('discoveries').select('*').eq('id', id).single();

    if (error || !data) {
        console.error("Error fetching discovery for edit", error);
        notFound();
    }
    
    return data as Discovery;
}

async function getConfrarias(): Promise<Confraria[]> {
    const supabase = createServiceRoleClient();
    const { data, error } = await supabase.from('confrarias').select('*').order('name');
    if (error) {
        console.error("Error fetching confrarias for discovery edit", error);
        return [];
    }
    return data as Confraria[];
}


export default async function EditDiscoveryPage({ params }: { params: { discoveryId: string } }) {
    await checkAdmin();
    const discoveryId = parseInt(params.discoveryId, 10);
    if (isNaN(discoveryId)) {
        notFound();
    }
    
    const [discoveryData, confrarias] = await Promise.all([
        getDiscovery(discoveryId),
        getConfrarias()
    ]);

    return (
        <EditDiscoveryForm discovery={discoveryData} confrarias={confrarias} />
    );
}
