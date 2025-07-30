

'use client';

import { createClient } from '@/lib/supabase/client';
import type { Confraria, Discovery, Event } from '@/lib/data';
import { notFound, useRouter } from 'next/navigation';
import Image from 'next/image';
import { ArrowLeft, BookOpen, Calendar, Check, Clock, Feather, MapPin, Users, UserPlus, Wrench, EyeOff, Newspaper, History } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { DiscoveryCard } from '@/components/discovery-card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { toggleMembershipRequest } from './actions';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import type { User } from '@supabase/supabase-js';
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

type ConfrariaPageProps = {
  params: {
    confrariaId: string;
  };
};

type ConfrariaDetails = Confraria & {
  discoveries: Discovery[];
  events: Event[];
  member_count: number;
  membership_status: 'member' | 'pending' | 'none';
  is_responsible: boolean;
  history: string;
  founders: string;
};

// We need a client component to handle the state of the history modal
function HistoryCard({ history, confrariaName }: { history: string; confrariaName: string }) {
    const [open, setOpen] = useState(false);
    const MAX_LENGTH = 300; // Character limit before showing "Ver Mais"
    const isLongText = history.length > MAX_LENGTH;

    return (
        <Card>
            <CardHeader>
                <CardTitle className="font-headline text-2xl flex items-center gap-3">
                    <History className="h-6 w-6 text-primary/80"/>
                    A Nossa História
                </CardTitle>
            </CardHeader>
            <CardContent className="font-body text-foreground/90 whitespace-pre-wrap space-y-4">
                <p>
                    {isLongText ? `${history.substring(0, MAX_LENGTH)}...` : history}
                </p>
                {isLongText && (
                    <Dialog open={open} onOpenChange={setOpen}>
                        <DialogTrigger asChild>
                            <Button variant="secondary">Ver Mais</Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-2xl">
                            <DialogHeader>
                                <DialogTitle className="font-headline text-3xl">A História da {confrariaName}</DialogTitle>
                            </DialogHeader>
                            <div className="max-h-[70vh] overflow-y-auto pr-4">
                                <p className="font-body text-foreground/90 whitespace-pre-wrap py-4">
                                    {history}
                                </p>
                            </div>
                        </DialogContent>
                    </Dialog>
                )}
            </CardContent>
        </Card>
    )
}

// The page itself remains a server component for data fetching
export default function ConfrariaPage({ params }: ConfrariaPageProps) {
    const [confraria, setConfraria] = useState<ConfrariaDetails | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const supabase = createClient();
    const { confrariaId } = params;

    useEffect(() => {
        async function getConfrariaDetails() {
            const { data: { user: currentUser } } = await supabase.auth.getUser();
            setUser(currentUser);

            const { data: confrariaData, error } = await supabase
                .from('confrarias')
                .select(`
                    *,
                    discoveries (
                        *,
                        confrarias ( id, name, seal_url, seal_hint ),
                        discovery_seal_counts ( seal_count ),
                        discovery_types ( name )
                    ),
                    confraria_members ( id, status ),
                    events ( * )
                `)
                .eq('id', confrariaId)
                .single();
            
            if (error || !confrariaData) {
                console.error(`Error fetching confraria with id ${confrariaId}:`, error);
                return notFound();
            }

            let membership_status: 'member' | 'pending' | 'none' = 'none';
            if(currentUser) {
                const { data: userMembership } = await supabase
                    .from('confraria_members')
                    .select('status')
                    .eq('user_id', currentUser.id)
                    .eq('confraria_id', confrariaData.id)
                    .single();

                if (userMembership) {
                    membership_status = userMembership.status as 'member' | 'pending';
                }
            }

            const discoveries = confrariaData.discoveries.map((d: any) => ({
                ...d,
                type: d.discovery_types.name,
                confrariaId: d.confraria_id,
                imageUrl: d.image_url,
                imageHint: d.image_hint,
                confrarias: d.confrarias ? { ...d.confrarias, sealUrl: d.confrarias.seal_url, sealHint: d.confrarias.seal_hint } : undefined,
                seal_count: d.discovery_seal_counts[0]?.seal_count || 0,
            })) as Discovery[];

            const isAdmin = currentUser?.email === process.env.NEXT_PUBLIC_ADMIN_EMAIL;
            
            setConfraria({
                ...confrariaData,
                sealUrl: confrariaData.seal_url,
                sealHint: confrariaData.seal_hint,
                discoveries,
                events: confrariaData.events.sort((a: Event, b: Event) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime()),
                member_count: confrariaData.confraria_members.filter((m: any) => m.status === 'approved').length,
                membership_status,
                is_responsible: currentUser?.id === confrariaData.responsible_user_id || isAdmin,
                history: confrariaData.history || 'A história desta confraria ainda não foi contada.',
                founders: confrariaData.founders || 'Os nobres fundadores desta confraria ainda não foram nomeados.',
            } as ConfrariaDetails);
            setLoading(false);
        }

        getConfrariaDetails();
    }, [confrariaId, supabase]);


    if (loading) {
        return <div>A carregar...</div>; // TODO: Add Skeleton loader
    }
    
    if (!confraria) {
        return notFound();
    }
    
    const MembershipButton = () => {
        if (confraria.is_responsible && user) {
             return (
                <Button asChild>
                    <Link href={`/confrarias/${confraria.id}/manage`}>
                        <Wrench /> Gerir Confraria
                    </Link>
                </Button>
            );
        }

        if (!user) {
            return (
                <Button asChild>
                    <Link href={`/login?redirect=/confrarias/${confraria.id}`}>
                        <UserPlus /> Solicitar Associação
                    </Link>
                </Button>
            );
        }

        if (confraria.membership_status === 'member') {
            return (
                <Button disabled variant="secondary">
                    <Check /> Você é Membro
                </Button>
            );
        }

        if (confraria.membership_status === 'pending') {
            return (
                <form action={toggleMembershipRequest}>
                    <input type="hidden" name="confrariaId" value={confraria.id} />
                    <input type="hidden" name="hasRequested" value="true" />
                     <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button type="submit" variant="outline" className="text-destructive hover:text-destructive hover:bg-destructive/10">
                                    <Clock /> Adesão Pendente
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>Clique para cancelar o seu pedido de adesão.</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </form>
            );
        }

        return (
            <form action={toggleMembershipRequest}>
                <input type="hidden" name="confrariaId" value={confraria.id} />
                 <input type="hidden" name="hasRequested" value="false" />
                <Button type="submit">
                    <UserPlus /> Solicitar Associação
                </Button>
            </form>
        );
    };

    return (
        <div>
             <div className="mb-8 container mx-auto px-4 pt-8">
                <Button variant="ghost" asChild>
                    <Link href="/confrarias">
                        <ArrowLeft />
                        Voltar às confrarias
                    </Link>
                </Button>
            </div>
             <div className="relative h-48 md:h-64 w-full mb-[-4rem] md:mb-[-6rem]">
                <Image 
                    src="https://placehold.co/1200x300.png"
                    alt={`Banner da ${confraria.name}`}
                    fill
                    className="object-cover"
                    data-ai-hint="abstract texture"
                />
                 <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent"></div>
            </div>

            <div className="container mx-auto px-4 py-8 md:py-12 relative">
                <section className="bg-card border rounded-lg p-6 md:p-8 mb-12 shadow-lg">
                    <div className="flex flex-col md:flex-row items-center gap-6 md:gap-8">
                        <Image
                            src={confraria.sealUrl}
                            alt={`Selo da ${confraria.name}`}
                            width={150}
                            height={150}
                            className="rounded-full bg-muted p-3 shadow-lg -mt-16 md:-ml-16 md:-mt-24"
                            data-ai-hint={confraria.sealHint}
                        />
                        <div className="text-center md:text-left flex-grow">
                            <h1 className="font-headline text-4xl md:text-5xl font-bold text-primary mb-2">
                                {confraria.name}
                            </h1>
                            <p className="text-xl md:text-2xl italic text-muted-foreground mb-4">
                                &quot;{confraria.motto}&quot;
                            </p>
                            <div className="flex justify-center md:justify-start flex-wrap gap-2">
                                <Badge variant="secondary" className="text-sm flex items-center gap-2 px-3 py-1">
                                    <MapPin className="h-4 w-4" />
                                    <span>{confraria.region}</span>
                                </Badge>
                                <Badge variant="secondary" className="text-sm flex items-center gap-2 px-3 py-1">
                                    <BookOpen className="h-4 w-4" />
                                    <span>{confraria.discoveries.length} {confraria.discoveries.length === 1 ? 'descoberta' : 'descobertas'}</span>
                                </Badge>
                                <Badge variant="secondary" className="text-sm flex items-center gap-2 px-3 py-1">
                                    <UserPlus className="h-4 w-4" />
                                    <span>{confraria.member_count} {confraria.member_count === 1 ? 'membro' : 'membros'}</span>
                                </Badge>
                            </div>
                        </div>
                        <div className="shrink-0 mt-4 md:mt-0">
                            <MembershipButton />
                        </div>
                    </div>
                </section>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                    <div className="lg:col-span-2 space-y-12">

                         <section>
                             <h2 className="font-headline text-3xl md:text-4xl font-bold mb-6 flex items-center gap-3">
                                <Newspaper className="h-8 w-8 text-primary/80"/>
                                Publicações
                            </h2>
                            <Card className="border-l-4 border-primary">
                                <CardContent className="p-6 text-center text-muted-foreground">
                                    Em breve, as confrarias poderão partilhar as suas novidades e artigos aqui.
                                </CardContent>
                            </Card>
                        </section>

                        <section>
                            <h2 className="font-headline text-3xl md:text-4xl font-bold mb-6 flex items-center gap-3">
                                <Calendar className="h-8 w-8 text-primary/80"/>
                                Próximos Eventos
                            </h2>
                             {confraria.events && confraria.events.length > 0 ? (
                                <div className="space-y-4">
                                    {confraria.events.map(event => (
                                         <Card key={event.id} className="border-l-4 border-primary/50 flex flex-col sm:flex-row">
                                            <div className="flex-shrink-0 w-full sm:w-40 h-40 sm:h-auto relative">
                                                <Image src={event.image_url ?? 'https://placehold.co/400x400.png'} alt={event.name} layout="fill" className="object-cover rounded-t-lg sm:rounded-l-lg sm:rounded-t-none" data-ai-hint={event.image_hint ?? 'event'} />
                                            </div>
                                            <CardHeader className="flex-grow">
                                                <CardTitle className="font-headline text-2xl flex items-center justify-between">
                                                    {event.name}
                                                    {!event.is_public && (
                                                         <TooltipProvider>
                                                            <Tooltip>
                                                                <TooltipTrigger>
                                                                    <Badge variant="secondary" className="flex items-center gap-1">
                                                                        <EyeOff className="h-3 w-3" /> Privado
                                                                    </Badge>
                                                                </TooltipTrigger>
                                                                <TooltipContent>
                                                                    <p>Este evento é visível apenas para membros.</p>
                                                                </TooltipContent>
                                                            </Tooltip>
                                                        </TooltipProvider>
                                                    )}
                                                </CardTitle>
                                                <CardDescription className="flex items-center gap-2 pt-2 text-base"><Calendar className="h-4 w-4"/> {new Date(event.event_date).toLocaleDateString('pt-PT', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</CardDescription>
                                                <CardContent className="p-0 pt-2">
                                                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{event.description}</p>
                                                    <p className="font-semibold flex items-center gap-2 pt-2"><MapPin className="h-4 w-4 text-primary"/>{event.location || 'Local a confirmar'}</p>
                                                </CardContent>
                                            </CardHeader>
                                        </Card>
                                    ))}
                                </div>
                            ) : (
                                <Card className="border-l-4 border-primary">
                                    <CardContent className="p-6 text-center text-muted-foreground">
                                        De momento, não existem eventos agendados.
                                    </CardContent>
                                </Card>
                            )}
                        </section>
                
                        <section>
                            <h2 className="font-headline text-3xl md:text-4xl font-bold mb-6 flex items-center gap-3">
                                <BookOpen className="h-8 w-8 text-primary/80"/>
                                Descobertas Recomendadas
                            </h2>
                            {confraria.discoveries && confraria.discoveries.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    {confraria.discoveries.map((discovery) => (
                                    <DiscoveryCard key={discovery.id} discovery={discovery} />
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-12 text-muted-foreground bg-card border rounded-lg">
                                    <p className="font-semibold text-lg">Nenhuma descoberta por aqui... ainda.</p>
                                    <p>Esta confraria ainda não partilhou os seus segredos.</p>
                                </div>
                            )}
                        </section>
                    </div>

                    <aside className="space-y-8 lg:mt-[92px]">
                         <HistoryCard history={confraria.history} confrariaName={confraria.name} />
                         <Card>
                            <CardHeader>
                                <CardTitle className="font-headline text-2xl flex items-center gap-3">
                                    <Users className="h-6 w-6 text-primary/80"/>
                                    Fundadores
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="font-body text-foreground/90 whitespace-pre-wrap">
                                {confraria.founders}
                            </CardContent>
                        </Card>
                    </aside>
                </div>
            </div>
        </div>
    );
}
