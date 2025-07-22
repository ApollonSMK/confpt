

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
import { getUserRank, type UserRankInfo } from '@/lib/data';
import { EventForm } from './event-form';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import type { Event } from '@/lib/data';
import Image from 'next/image';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';


type PendingMember = {
    id: number;
    user_id: string;
    user_email: string;
    user_full_name: string | null;
    rank: UserRankInfo;
}

type ConfrariaDataType = {
    id: number;
    name: string;
    motto: string;
    history: string;
    founders: string;
}

async function getConfrariaAndRelatedData(id: number, user: User) {
    const supabase = createServerClient();
    const supabaseService = createServiceRoleClient();

    // 1. Get confraria details
    const { data: confrariaData, error: confrariaError } = await supabase
        .from('confrarias')
        .select('*')
        .eq('id', id)
        .single();

    if (confrariaError || !confrariaData) {
        console.error("Error fetching confraria for management", confrariaError);
        notFound();
    }
    
    // Security check: ensure the logged-in user is the responsible user or admin
    const isAdmin = (user.email === process.env.ADMIN_EMAIL);
    if (confrariaData.responsible_user_id !== user.id && !isAdmin) {
        console.warn(`User ${user.id} tried to manage confraria ${id} without permission.`);
        redirect(`/confrarias/${id}`);
    }

    // 2. Get pending membership requests
    const { data: pendingRequests, error: membersError } = await supabase
        .from('confraria_members')
        .select('id, user_id')
        .eq('confraria_id', id)
        .eq('status', 'pending');

    if (membersError) {
        console.error("Error fetching pending members requests:", membersError);
    }
    
    let pendingMembers: PendingMember[] = [];
    if (pendingRequests && pendingRequests.length > 0) {
        const userIds = pendingRequests.map(r => r.user_id);
        const { data: users, error: usersError } = await supabaseService.rpc('get_user_emails_by_ids', { p_user_ids: userIds });
        
        if (usersError) {
            console.error("Error fetching users for pending members:", usersError);
        } else {
             // Fetch all required counts in parallel
            const [
                { data: sealsData },
                { data: submissionsData }
            ] = await Promise.all([
                supabaseService
                    .from('seals')
                    .select('user_id, discovery_id', { count: 'exact' })
                    .in('user_id', userIds),
                supabaseService
                    .from('submissions')
                    .select('user_id', { count: 'exact' })
                    .in('user_id', userIds)
                    .eq('status', 'Aprovado')
            ]);
            
            // Process the results into maps for efficient lookup
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
    
    // 3. Get Events using service client to bypass RLS issues on read
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
        }, 
        pendingMembers,
        events: (events as Event[] || []) 
    };
}


const ActionButtons = ({ member, confrariaId }: { member: PendingMember, confrariaId: number }) => (
    <form action={handleMembershipAction} className="flex gap-2 justify-end">
        <input type="hidden" name="membershipId" value={member.id} />
        <input type="hidden" name="confrariaId" value={confrariaId} />
        <Button type="submit" name="action" value="approve" size="icon" variant="outline" className="text-green-600 hover:bg-green-100 hover:text-green-700">
            <Check className="h-4 w-4" />
        </Button>
        <Button type="submit" name="action" value="reject" size="icon" variant="outline" className="text-red-600 hover:bg-red-100 hover:text-red-700">
            <X className="h-4 w-4" />
        </Button>
    </form>
);

const TabContentCard = ({ title, description, children, icon: Icon, badgeText, actions }: { title: string, description: string, children: React.ReactNode, icon: React.ElementType, badgeText?: string, actions?: React.ReactNode }) => (
    <Card>
        <CardHeader className="flex flex-row items-start justify-between">
            <div>
                 <CardTitle className="font-headline text-3xl flex items-center gap-3">
                    <Icon className="h-7 w-7 text-primary"/>
                    {title}
                </CardTitle>
                <CardDescription>{description}</CardDescription>
            </div>
            <div className="flex items-center gap-4">
                {badgeText && <Badge variant="destructive">{badgeText}</Badge>}
                {actions}
            </div>
        </CardHeader>
        <CardContent>
            {children}
        </CardContent>
    </Card>
);


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
    
    return (
        <div className="container mx-auto px-4 py-8 md:py-16 space-y-8">
            <div>
                 <h1 className="font-headline text-4xl md:text-5xl font-bold mb-2">Painel da {confrariaData.name}</h1>
                <p className="text-lg text-muted-foreground">
                    Bem-vindo, Confrade Responsável. Gira a sua confraria a partir daqui.
                </p>
            </div>
            
            <Tabs defaultValue="overview" className="w-full">
                <TabsList className="grid w-full grid-cols-5">
                    <TabsTrigger value="overview"><LayoutDashboard className="mr-2 h-4 w-4"/>Visão Geral</TabsTrigger>
                    <TabsTrigger value="details"><PenSquare className="mr-2 h-4 w-4"/>Editar Detalhes</TabsTrigger>
                    <TabsTrigger value="requests">
                        <UserPlus className="mr-2 h-4 w-4"/>
                        Pedidos de Adesão
                        {pendingMembers.length > 0 && <Badge className="ml-2">{pendingMembers.length}</Badge>}
                    </TabsTrigger>
                    <TabsTrigger value="members" disabled><Users className="mr-2 h-4 w-4"/>Membros</TabsTrigger>
                    <TabsTrigger value="events">
                        <Calendar className="mr-2 h-4 w-4"/>
                        Eventos
                        {events.length > 0 && <Badge className="ml-2">{events.length}</Badge>}
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="mt-6">
                    <TabContentCard title="Visão Geral" description="Resumo rápido do estado da sua confraria." icon={LayoutDashboard}>
                       <p>Bem-vindo ao painel de gestão. Use as abas acima para navegar entre as diferentes secções.</p>
                        <p className="mt-4 text-sm text-muted-foreground">Futuramente, esta área terá estatísticas e atalhos úteis.</p>
                    </TabContentCard>
                </TabsContent>
                
                <TabsContent value="details" className="mt-6">
                    <TabContentCard title="Editar Detalhes" description="Atualize as informações públicas da sua confraria que todos podem ver." icon={PenSquare}>
                        <ManageConfrariaForm confraria={confrariaData} />
                    </TabContentCard>
                </TabsContent>

                <TabsContent value="requests" className="mt-6">
                     <TabContentCard 
                        title="Pedidos de Adesão" 
                        description="Aprove ou rejeite os pedidos dos confrades que desejam juntar-se." 
                        icon={UserPlus}
                        badgeText={pendingMembers.length > 0 ? `${pendingMembers.length} pendente(s)` : undefined}
                     >
                        {pendingMembers.length > 0 ? (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Confrade</TableHead>
                                        <TableHead>Cargo</TableHead>
                                        <TableHead className="text-right">Ações</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {pendingMembers.map((member) => (
                                        <TableRow key={member.id}>
                                            <TableCell className="font-medium">
                                                <div className="font-bold">{member.user_full_name}</div>
                                                <div className="text-xs text-muted-foreground">{member.user_email}</div>
                                            </TableCell>
                                             <TableCell>
                                                <Badge variant="secondary" className="flex items-center gap-2 w-fit">
                                                    <member.rank.rankIcon className="h-4 w-4 text-primary" />
                                                    <span>{member.rank.rankName}</span>
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <ActionButtons member={member} confrariaId={confrariaData.id} />
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        ) : (
                            <div className="text-center py-12 text-muted-foreground">
                                <p className="font-semibold text-lg">Nenhum pedido pendente.</p>
                                <p>De momento, não há novos aspirantes a confrade.</p>
                            </div>
                        )}
                    </TabContentCard>
                </TabsContent>

                 <TabsContent value="members" className="mt-6">
                    <TabContentCard title="Gestão de Membros" description="Veja todos os membros, altere cargos ou remova membros." icon={Users}>
                         <div className="text-center py-12 text-muted-foreground">
                            <p className="font-semibold text-lg">Funcionalidade Futura</p>
                            <p>Em breve poderá gerir todos os membros da sua confraria aqui.</p>
                        </div>
                    </TabContentCard>
                </TabsContent>

                 <TabsContent value="events" className="mt-6">
                     <Dialog>
                        <TabContentCard 
                            title="Gestão de Eventos" 
                            description="Crie e gira os eventos e encontros da sua confraria." 
                            icon={Calendar}
                            actions={
                                <DialogTrigger asChild>
                                    <Button><PlusCircle/> Adicionar Evento</Button>
                                </DialogTrigger>
                            }>
                            {events.length > 0 ? (
                                <div className="space-y-4">
                                    {events.map(event => (
                                        <Card key={event.id} className="flex items-center p-4 gap-4">
                                            <Image src={event.image_url ?? 'https://placehold.co/100x100.png'} alt={event.name} width={80} height={80} className="rounded-md object-cover" data-ai-hint={event.image_hint ?? 'event'} />
                                            <div className="flex-grow">
                                                <h3 className="font-bold">{event.name}</h3>
                                                <p className="text-sm text-muted-foreground flex items-center gap-2"><Calendar className="h-4 w-4" /> {new Date(event.event_date).toLocaleDateString('pt-PT', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                                                <p className="text-sm text-muted-foreground flex items-center gap-2"><MapPin className="h-4 w-4" /> {event.location || 'Local a confirmar'}</p>
                                            </div>
                                            <DialogTrigger asChild>
                                                <Button variant="outline" size="icon"><Edit className="h-4 w-4"/></Button>
                                            </DialogTrigger>
                                        </Card>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-12 text-muted-foreground">
                                    <p className="font-semibold text-lg">Nenhum evento agendado.</p>
                                    <p>Crie o seu primeiro evento para juntar os confrades.</p>
                                </div>
                            )}
                        </TabContentCard>
                        <DialogContent className="sm:max-w-[425px]">
                            <DialogHeader>
                                <DialogTitle>Adicionar Novo Evento</DialogTitle>
                                <DialogDescription>
                                    Preencha os detalhes do seu evento. Clique em guardar quando terminar.
                                </DialogDescription>
                            </DialogHeader>
                            <EventForm confrariaId={confrariaData.id} />
                        </DialogContent>
                    </Dialog>
                </TabsContent>

            </Tabs>
        </div>
    );
}

    