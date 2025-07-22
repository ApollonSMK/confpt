
import { createServerClient } from '@/lib/supabase/server';
import { notFound, redirect } from 'next/navigation';
import { ManageConfrariaForm } from './edit-form';
import type { User } from '@supabase/supabase-js';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Check, UserPlus, Users, X } from 'lucide-react';
import { handleMembershipAction } from './actions';

type PendingMember = {
    id: number;
    user_id: string;
    users: {
        email: string;
        full_name: string | null;
        avatar_url: string | null;
    }
}

async function getConfrariaAndPendingMembers(id: number, user: User) {
    const supabase = createServerClient();
    const { data: { user: currentUser } } = await supabase.auth.getUser();

    // 1. Get confraria details
    const { data, error } = await supabase
        .from('confrarias')
        .select('*')
        .eq('id', id)
        .single();

    if (error || !data) {
        console.error("Error fetching confraria for management", error);
        notFound();
    }
    
    const isAdmin = currentUser?.email === process.env.ADMIN_EMAIL;

    // Security check: ensure the logged-in user is the responsible user or admin
    if (data.responsible_user_id !== user.id && !isAdmin) {
        console.warn(`User ${user.id} tried to manage confraria ${id} without permission.`);
        redirect(`/confrarias/${id}`);
    }

    // 2. Get pending members for this confraria
    const { data: pendingMembers, error: membersError } = await supabase
        .from('confraria_members')
        .select(`
            id,
            user_id,
            users (
                email,
                full_name,
                avatar_url
            )
        `)
        .eq('confraria_id', id)
        .eq('status', 'pending');

    if (membersError) {
        console.error("Error fetching pending members:", membersError);
    }
    
    const confrariaData = {
      id: data.id,
      name: data.name,
      motto: data.motto,
      history: data.history ?? '',
      founders: data.founders ?? '',
    };

    return { confrariaData, pendingMembers: (pendingMembers as PendingMember[] || []) };
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
            <ManageConfrariaForm confraria={confrariaData} />

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
                                            {member.users?.full_name || member.users?.email || 'Desconhecido'}
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

             <Card>
                <CardHeader>
                    <CardTitle className="font-headline text-3xl flex items-center gap-3">
                        <Users className="h-7 w-7 text-primary"/>
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
    );
}

    