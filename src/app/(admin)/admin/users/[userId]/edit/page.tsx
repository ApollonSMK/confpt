

import { createServiceRoleClient } from '@/lib/supabase/service';
import { createServerClient } from '@/lib/supabase/server';
import { notFound, redirect } from 'next/navigation';
import { EditUserForm } from './edit-form';
import type { User } from '@supabase/supabase-js';
import type { Discovery } from '@/lib/data';

async function checkAdmin() {
  const supabase = createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || user.email !== process.env.ADMIN_EMAIL) {
    redirect('/login');
  }
}

async function getUser(id: string): Promise<User> {
    const supabase = createServiceRoleClient();
    const { data, error } = await supabase.auth.admin.getUserById(id);

    if (error || !data.user) {
        console.error("Error fetching user for edit", error);
        notFound();
    }
    
    return data.user;
}

async function getSealedDiscoveries(userId: string): Promise<Pick<Discovery, 'id' | 'title' | 'district' | 'slug'>[]> {
    const supabase = createServiceRoleClient();

    const { data: seals, error: sealsError } = await supabase
        .from('seals')
        .select('discovery_id')
        .eq('user_id', userId);

    if (sealsError || !seals || seals.length === 0) {
        return [];
    }

    const discoveryIds = seals.map(s => s.discovery_id);

    const { data, error } = await supabase
        .from('discoveries')
        .select('id, title, district, slug')
        .in('id', discoveryIds);

     if (error) {
        console.error('Error fetching sealed discoveries for admin user edit:', error);
        return [];
    }

    return data;
}


export default async function EditUserPage({ params }: { params: { userId: string } }) {
    await checkAdmin();
    const userId = params.userId;
    if (!userId) {
        notFound();
    }
    
    const [userData, sealedDiscoveries] = await Promise.all([
        getUser(userId),
        getSealedDiscoveries(userId)
    ]);


    return (
        <EditUserForm userData={userData} sealedDiscoveries={sealedDiscoveries} />
    );
}
