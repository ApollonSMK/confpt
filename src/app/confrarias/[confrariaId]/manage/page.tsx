
import { createServerClient } from '@/lib/supabase/server';
import { notFound, redirect } from 'next/navigation';
import { ManageConfrariaForm } from './edit-form';
import type { User } from '@supabase/supabase-js';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Check, UserPlus, Users, X, Calendar } from 'lucide-react';
import { handleMembershipAction } from './actions';
import { createServiceRoleClient } from '@/lib/supabase/service';

type PendingMember = {
    id: number;
    user_id: string;
    user_email: string;
    user_full_name: string | null;
}

async function getConfrariaAndPendingMembers(id: number, user: User) {
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
    const isAdmin = user.email === process.env.ADMIN_EMAIL;
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
        return { confrariaData: { ...confrariaData, history: confrariaData.history ?? '', founders: confrariaData.founders ?? '' }, pendingMembers: [] };
    }
    
    if (!pendingRequests || pendingRequests.length === 0) {
        return { confrariaData: { ...confrariaData, history: confrariaData.history ?? '', founders: confrariaData.founders ?? '' }, pendingMembers: [] };
    }
    
    // 3. Get user details for pending members
    const userIds = pendingRequests.map(r => r.user_id);
    const { data: users, error: usersError } = await supabaseService.rpc('get_user_emails_by_ids', { p_user_ids: userIds });

    if (usersError) {
        console.error("Error fetching users for pending members:", usersError);
        return { confrariaData: { ...confrariaData, history: confrariaData.history ?? '', founders: confrariaData.founders ?? '' }, pendingMembers: [] };
    }

    const usersById = new Map(users.map((u: any) => [u.id, u]));

    const pendingMembers = pendingRequests.map(request => {
        const user = usersById.get(request.user_id);
        return {
            id: request.id,
            user_id: request.user_id,
            user_email: user?.email ?? 'Email Desconhecido',
            user_full_name: user?.full_name ?? null,
        };
    });

    return { 
        confrariaData: {
            id: confrariaData.id,
            name: confrariaData.name,
            motto: confrariaData.motto,
            history: confrariaData.history ?? '',
            founders: confrariaData.founders ?? '',
        }, 
        pendingMembers: (pendingMembers as PendingMember[] || []) 
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
    
    const { confrariaData, pendingMembers } = await getConfrariaAndPendingMembers(confrariaId, user);

    const ActionButtons = ({ member }: { member: PendingMember }) => (
        <form action={handleMembershipAction} className="flex gap-2 justify-end">
            <input type="hidden" name="membershipId" value={member.id} />
            <input type="hidden" name="confrariaId" value={confrariaData.id} />
            <Button type="submit" name="action" value="approve" size="icon" variant="outline" className="text-green-600 hover:bg-green-100 hover:text-green-700">
                <Check className="h-4 w-4" />
            </Button>
            <Button type="submit" name="action" value="reject" size="icon" variant="outline" className="text-red-600 hover:bg-red-100 hover:text-red-700">
                <X className="h-4 w-4" />
            </Button>
        </form>
    );

    return (
        <div className="container mx-auto px-4 py-8 md:py-16 space-y-12">
            <div>
                 <h1 className="font-headline text-4xl md:text-5xl font-bold mb-2">Painel da {confrariaData.name}</h1>
                <p className="text-lg text-muted-foreground">
                    Bem-vindo, Confrade Responsável. Gira a sua confraria a partir daqui.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                 <div className="space-y-8">
                    <ManageConfrariaForm confraria={confrariaData} />

                    <Card>
                        <CardHeader>
                            <CardTitle className="font-headline text-3xl flex items-center gap-3">
                                <Users className="h-7 w-7 text-primary"/>
                                Gestão de Membros
                            </CardTitle>
                            <CardDescription>
                                (Funcionalidade Futura) Veja todos os membros, altere cargos ou remova membros.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="text-center py-12 text-muted-foreground">
                                <p>Em breve...</p>
                            </div>
                        </CardContent>
                    </Card>
                 </div>
                 <div className="space-y-8">
                    <Card>
                        <CardHeader>
                            <CardTitle className="font-headline text-3xl flex items-center gap-3">
                                <UserPlus className="h-7 w-7 text-primary"/>
                                Pedidos de Adesão
                            </CardTitle>
                            <CardDescription>
                                Aprove ou rejeite os pedidos dos confrades que desejam juntar-se.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {pendingMembers.length > 0 ? (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Confrade</TableHead>
                                            <TableHead className="text-right">Ações</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {pendingMembers.map((member) => (
                                            <TableRow key={member.id}>
                                                <TableCell className="font-medium">
                                                    <div className="font-bold">{member.user_full_name || 'Desconhecido'}</div>
                                                    <div className="text-xs text-muted-foreground">{member.user_email}</div>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                <ActionButtons member={member} />
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
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="font-headline text-3xl flex items-center gap-3">
                                <Calendar className="h-7 w-7 text-primary"/>
                                Gestão de Eventos
                            </CardTitle>
                            <CardDescription>
                                (Funcionalidade Futura) Crie e gira os eventos da sua confraria.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="text-center py-12 text-muted-foreground">
                                <p>Em breve...</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
