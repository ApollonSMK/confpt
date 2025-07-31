

'use server';

import { createServerClient } from '@/lib/supabase/server';
import { notFound, redirect } from 'next/navigation';
import type { User } from '@supabase/supabase-js';
import { createServiceRoleClient } from '@/lib/supabase/service';
import { getUserRank, type UserRankInfo } from '@/lib/data';
import type { Event, Article } from '@/lib/data';
import { ClientManagePage, type ManageConfrariaPageProps } from './client-page';


type Member = {
    id: number; // This is the membership ID
    user_id: string;
    user_email: string;
    user_full_name: string | null;
    rank: UserRankInfo;
}

async function getMembers(confrariaId: number, status: 'pending' | 'approved', supabaseService: any): Promise<Member[]> {
    const { data: memberRequests, error: membersError } = await supabaseService
        .from('confraria_members')
        .select('id, user_id')
        .eq('confraria_id', confrariaId)
        .eq('status', status);

    if (membersError) {
        console.error(`Error fetching ${status} members:`, membersError);
        return [];
    }
    
    if (!memberRequests || memberRequests.length === 0) {
        return [];
    }

    const userIds = memberRequests.map(r => r.user_id);
    const { data: users, error: usersError } = await supabaseService.rpc('get_user_emails_by_ids', { p_user_ids: userIds });
    
    if (usersError) {
        console.error("Error fetching users for members:", usersError);
        return [];
    }

    const [{ data: sealsData }, { data: submissionsData }] = await Promise.all([
        supabaseService.from('seals').select('user_id', { count: 'exact' }).in('user_id', userIds),
        supabaseService.from('submissions').select('user_id', { count: 'exact' }).in('user_id', userIds).eq('status', 'Aprovado')
    ]);
    
    const sealsByUser = (sealsData ?? []).reduce((acc: Record<string, number>, record: any) => {
        if (record.user_id) acc[record.user_id] = (acc[record.user_id] || 0) + 1;
        return acc;
    }, {});
    const submissionsByUser = (submissionsData ?? []).reduce((acc: Record<string, number>, record: any) => {
       if (record.user_id) acc[record.user_id] = (acc[record.user_id] || 0) + 1;
        return acc;
    }, {});
    const usersById = new Map(users.map((u: any) => [u.id, u]));

    return memberRequests.map(request => {
        const userProfile = usersById.get(request.user_id);
        const sealedDiscoveriesCount = sealsByUser[request.user_id] || 0;
        const approvedSubmissionsCount = submissionsByUser[request.user_id] || 0;
        const rank = getUserRank(sealedDiscoveriesCount, approvedSubmissionsCount, userProfile?.rank_override);
        return {
            id: request.id,
            user_id: request.user_id,
            user_email: userProfile?.email ?? 'Email Desconhecido',
            user_full_name: userProfile?.full_name ?? 'Desconhecido',
            rank: rank,
        };
    });
}

async function getConfrariaAndRelatedData(id: number, user: User) {
    const supabaseService = createServiceRoleClient();

    const { data: confrariaData, error: confrariaError } = await supabaseService
        .from('confrarias')
        .select('*')
        .eq('id', id)
        .single();

    if (confrariaError || !confrariaData) {
        console.error("Error fetching confraria for management", confrariaError);
        notFound();
    }
    
    const isAdmin = (user.email === process.env.ADMIN_EMAIL);
    if (confrariaData.responsible_user_id !== user.id && !isAdmin) {
        console.warn(`User ${user.id} tried to manage confraria ${id} without permission.`);
        redirect(`/confrarias/${id}`);
    }
    
    const [pendingMembers, approvedMembers, events, articles] = await Promise.all([
        getMembers(id, 'pending', supabaseService),
        getMembers(id, 'approved', supabaseService),
        supabaseService.from('events').select('*').eq('confraria_id', id).order('event_date', { ascending: true }),
        supabaseService.from('articles').select('*').eq('confraria_id', id).order('created_at', { ascending: false }),
    ]);
    
    if(events.error) console.error("Error fetching events:", events.error);
    if(articles.error) console.error("Error fetching articles:", articles.error);

    return { 
        confrariaData: {
            id: confrariaData.id,
            name: confrariaData.name,
            motto: confrariaData.motto,
            history: confrariaData.history ?? '',
            founders: confrariaData.founders ?? '',
            region: confrariaData.region,
        }, 
        pendingMembers,
        approvedMembers,
        events: (events.data as Event[] || []),
        articles: (articles.data as Article[] || []),
    };
}


// Server component to fetch data
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
    
    const { confrariaData, pendingMembers, approvedMembers, events, articles } = await getConfrariaAndRelatedData(confrariaId, user);
    
    const pageProps: ManageConfrariaPageProps = {
        confrariaData,
        pendingMembers,
        approvedMembers,
        events,
        articles,
        user,
    };

    return (
        <ClientManagePage {...pageProps} />
    );
}
