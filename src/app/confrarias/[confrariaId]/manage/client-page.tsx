
'use client';

import { createServerClient } from '@/lib/supabase/server';
import { notFound, redirect, useRouter } from 'next/navigation';
import { ManageConfrariaForm } from './edit-form';
import type { User } from '@supabase/supabase-js';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, UserPlus, Users, X, Calendar, PenSquare, LayoutDashboard, PlusCircle, Edit, MapPin, Trash2, Loader2 } from 'lucide-react';
import { handleMembershipAction, removeMember } from './actions';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { getUserRank, type UserRankInfo, regions } from '@/lib/data';
import { EventForm } from './event-form';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import type { Event } from '@/lib/data';
import Image from 'next/image';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useState } from 'react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';


type Member = {
    id: number; // This is the membership ID
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
    region: (typeof regions)[number];
}

export type ManageConfrariaPageProps = {
    confrariaData: ConfrariaDataType;
    pendingMembers: Member[];
    approvedMembers: Member[];
    events: Event[];
    user: User;
}

// Client component to handle state and interactions
export function ClientManagePage({ confrariaData, pendingMembers, approvedMembers, events, user }: ManageConfrariaPageProps) {
    const router = useRouter();
    const { toast } = useToast();
    const [isDialogOpen, setDialogOpen] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
    const [isRemovingMember, setIsRemovingMember] = useState<number | null>(null);

    const handleEditClick = (event: Event) => {
        setSelectedEvent(event);
        setDialogOpen(true);
    };

    const handleAddNewClick = () => {
        setSelectedEvent(null);
        setDialogOpen(true);
    };

    const handleFormSuccess = () => {
        setDialogOpen(false);
        router.refresh(); 
    };
    
    const handleRemoveMember = async (membershipId: number, memberName: string) => {
        setIsRemovingMember(membershipId);
        const formData = new FormData();
        formData.append('membershipId', String(membershipId));
        formData.append('confrariaId', String(confrariaData.id));

        const result = await removeMember(formData);

        if (result.error) {
            toast({ title: 'Erro', description: result.error, variant: 'destructive' });
        } else {
            toast({ title: 'Sucesso', description: `O confrade ${memberName} foi removido.` });
            router.refresh();
        }
        setIsRemovingMember(null);
    };

    return (
        <div className="container mx-auto px-4 py-8 md:py-16 space-y-8">
            <div>
                 <h1 className="font-headline text-4xl md:text-5xl font-bold mb-2">Painel da {confrariaData.name}</h1>
                <p className="text-lg text-muted-foreground">
                    Bem-vindo, Confrade Responsável. Gira a sua confraria a partir daqui.
                </p>
            </div>
            
             <Dialog open={isDialogOpen} onOpenChange={setDialogOpen}>
                <Tabs defaultValue="overview" className="w-full">
                    <TabsList className="grid w-full grid-cols-5">
                        <TabsTrigger value="overview"><LayoutDashboard className="mr-2 h-4 w-4"/>Visão Geral</TabsTrigger>
                        <TabsTrigger value="details"><PenSquare className="mr-2 h-4 w-4"/>Editar Detalhes</TabsTrigger>
                        <TabsTrigger value="requests">
                            <UserPlus className="mr-2 h-4 w-4"/>
                            Pedidos
                            {pendingMembers.length > 0 && <Badge className="ml-2">{pendingMembers.length}</Badge>}
                        </TabsTrigger>
                        <TabsTrigger value="members">
                            <Users className="mr-2 h-4 w-4"/>
                            Membros
                             {approvedMembers.length > 0 && <Badge className="ml-2">{approvedMembers.length}</Badge>}
                        </TabsTrigger>
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
                                            <TableHead>Nível</TableHead>
                                            <TableHead className="text-right">Ações</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {pendingMembers.map((member) => (
                                            <TableRow key={member.id}>
                                                <TableCell className="font-medium">
                                                    <div className="font-bold">{member.user_full_name || 'Nome não definido'}</div>
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
                        <TabContentCard 
                            title="Gestão de Membros" 
                            description="Veja todos os membros, altere cargos ou remova membros." 
                            icon={Users}
                            badgeText={approvedMembers.length > 0 ? `${approvedMembers.length} membro(s)` : undefined}
                        >
                            {approvedMembers.length > 0 ? (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Confrade</TableHead>
                                            <TableHead>Nível</TableHead>
                                            <TableHead className="text-right">Ações</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {approvedMembers.map((member) => (
                                            <TableRow key={member.id}>
                                                <TableCell className="font-medium">
                                                    <div className="font-bold">{member.user_full_name || 'Nome não definido'}</div>
                                                    <div className="text-xs text-muted-foreground">{member.user_email}</div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="secondary" className="flex items-center gap-2 w-fit">
                                                        <member.rank.rankIcon className="h-4 w-4 text-primary" />
                                                        <span>{member.rank.rankName}</span>
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <AlertDialog>
                                                        <AlertDialogTrigger asChild>
                                                             <Button variant="destructive" size="icon" disabled={isRemovingMember === member.id}>
                                                                {isRemovingMember === member.id ? <Loader2 className="animate-spin"/> : <Trash2 />}
                                                             </Button>
                                                        </AlertDialogTrigger>
                                                        <AlertDialogContent>
                                                            <AlertDialogHeader>
                                                            <AlertDialogTitle>Expulsar Confrade?</AlertDialogTitle>
                                                            <AlertDialogDescription>
                                                                Tem a certeza que deseja remover <strong>{member.user_full_name || member.user_email}</strong> da confraria? Esta ação é irreversível.
                                                            </AlertDialogDescription>
                                                            </AlertDialogHeader>
                                                            <AlertDialogFooter>
                                                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                            <AlertDialogAction onClick={() => handleRemoveMember(member.id, member.user_full_name || member.user_email)} className="bg-destructive hover:bg-destructive/90">
                                                                Sim, Remover
                                                            </AlertDialogAction>
                                                            </AlertDialogFooter>
                                                        </AlertDialogContent>
                                                    </AlertDialog>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            ) : (
                                <div className="text-center py-12 text-muted-foreground">
                                    <p className="font-semibold text-lg">Ainda não há membros.</p>
                                    <p>Aprove os pedidos de adesão para começar a formar a sua irmandade.</p>
                                </div>
                            )}
                        </TabContentCard>
                    </TabsContent>
                    
                    <TabsContent value="events" className="mt-6">
                        <TabContentCard 
                            title="Gestão de Eventos" 
                            description="Crie e gira os eventos e encontros da sua confraria." 
                            icon={Calendar}
                            actions={
                                <Button onClick={handleAddNewClick}><PlusCircle/> Adicionar Evento</Button>
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
                                            <Button variant="outline" size="icon" onClick={() => handleEditClick(event)}><Edit className="h-4 w-4"/></Button>
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
                    </TabsContent>
                </Tabs>
                <DialogContent className="sm:max-w-xl">
                    <DialogHeader>
                        <DialogTitle>{selectedEvent ? 'Editar Evento' : 'Adicionar Novo Evento'}</DialogTitle>
                        <DialogDescription>
                            {selectedEvent ? 'Atualize os detalhes do seu evento.' : 'Preencha os detalhes do seu evento. Clique em guardar quando terminar.'}
                        </DialogDescription>
                    </DialogHeader>
                    <EventForm 
                        confrariaId={confrariaData.id} 
                        confrariaRegion={confrariaData.region} 
                        event={selectedEvent} 
                        onSuccess={handleFormSuccess}
                    />
                </DialogContent>
            </Dialog>
        </div>
    );
}


const ActionButtons = ({ member, confrariaId }: { member: Member, confrariaId: number }) => (
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
