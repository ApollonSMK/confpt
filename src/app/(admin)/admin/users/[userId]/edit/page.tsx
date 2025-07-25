
import { createServiceRoleClient } from '@/lib/supabase/service';
import { createServerClient } from '@/lib/supabase/server';
import { notFound, redirect } from 'next/navigation';
import { EditUserForm } from './edit-form';
import type { User } from '@supabase/supabase-js';

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


export default async function EditUserPage({ params }: { params: { userId: string } }) {
    await checkAdmin();
    const userId = params.userId;
    if (!userId) {
        notFound();
    }
    
    const userData = await getUser(userId);

    return (
        <EditUserForm userData={userData} />
    );
}
