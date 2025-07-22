

'use server';

import { createServerClient } from '@/lib/supabase/server';
import { notFound, redirect } from 'next/navigation';
import { ManageConfrariaForm } from './edit-form';
import type { User } from '@supabase/supabase-js';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, UserPlus, Users, X, Calendar, PenSquare, LayoutDashboard, PlusCircle, Edit, MapPin } from 'lucide-react';
import { handleMembershipAction } from './actions';
import { createServiceRoleClient } from '@/lib/supabase/service';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { getUserRank, type UserRankInfo, regions } from '@/lib/data';
import { EventForm } from './event-form';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import type { Event } from '@/lib/data';
import Image from 'next/image';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ClientManagePage, type ManageConfrariaPageProps } from './client-page';


type PendingMember = {
    id: number;
    user_id: string;
    user_email: string;
    user_full_name: string | null;
    rank: UserRankInfo;
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
    
    const { data: pendingRequests, error: membersError } = await supabaseService
        .from('confraria_members')
        .select('id, user_id')
        .eq('confraria_id', id)
        .eq('status', 'pending');

    if (membersError) console.error("Error fetching pending members requests:", membersError);
    
    let pendingMembers: PendingMember[] = [];
    if (pendingRequests && pendingRequests.length > 0) {
        const userIds = pendingRequests.map(r => r.user_id);
        const { data: users, error: usersError } = await supabaseService.rpc('get_user_emails_by_ids', { p_user_ids: userIds });
        
        if (usersError) {
            console.error("Error fetching users for pending members:", usersError);
        } else {
            const [{ data: sealsData }, { data: submissionsData }] = await Promise.all([
                supabaseService.from('seals').select('user_id, discovery_id', { count: 'exact' }).in('user_id', userIds),
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

            pendingMembers = pendingRequests.map(request => {
                const userProfile = usersById.get(request.user_id);
                const sealedDiscoveriesCount = sealsByUser[request.user_id] || 0;
                const approvedSubmissionsCount = submissionsByUser[request.user_id] || 0;
                const rank = getUserRank(sealedDiscoveriesCount, approvedSubmissionsCount);
                return {
                    id: request.id,
                    user_id: request.user_id,
                    user_email: userProfile?.email ?? 'Email Desconhecido',
                    user_full_name: userProfile?.full_name ?? 'Desconhecido',
                    rank: rank,
                };
            });
        }
    }
    
    const { data: events, error: eventsError } = await supabaseService
        .from('events')
        .select('*')
        .eq('confraria_id', id)
        .order('event_date', { ascending: true });

    if(eventsError) {
        console.error("Error fetching events:", eventsError);
    }

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
        events: (events as Event[] || []) 
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
    
    const { confrariaData, pendingMembers, events } = await getConfrariaAndRelatedData(confrariaId, user);
    
    const pageProps: ManageConfrariaPageProps = {
        confrariaData,
        pendingMembers,
        events,
        user,
    };

    return (
        <ClientManagePage {...pageProps} />
    );
}
