
import { createServerClient } from '@/lib/supabase/server';
import type { Confraria, Discovery } from '@/lib/data';
import { notFound, redirect } from 'next/navigation';
import Image from 'next/image';
import { ArrowLeft, BookOpen, Calendar, Check, Clock, Feather, MapPin, Users, UserPlus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { DiscoveryCard } from '@/components/discovery-card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { toggleMembershipRequest } from './actions';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type ConfrariaPageProps = {
  params: {
    confrariaId: string;
  };
};

type ConfrariaDetails = Confraria & {
  discoveries: Discovery[];
  member_count: number;
  membership_status: 'member' | 'pending' | 'none';
};

async function getConfrariaDetails(id: string): Promise<ConfrariaDetails | null> {
    const supabase = createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    const { data: confraria, error } = await supabase
        .from('confrarias')
        .select(`
            *,
            discoveries (
                *,
                confrarias (
                    id,
                    name,
                    seal_url,
                    seal_hint
                ),
                discovery_seal_counts (
                    seal_count
                )
            ),
            confraria_members (
                id,
                status
            )
        `)
        .eq('id', id)
        .single();
    
    if (error || !confraria) {
        console.error(`Error fetching confraria with id ${id}:`, error);
        return null;
    }

    let membership_status: 'member' | 'pending' | 'none' = 'none';
    if(user) {
        const { data: userMembership } = await supabase
            .from('confraria_members')
            .select('status')
            .eq('user_id', user.id)
            .eq('confraria_id', confraria.id)
            .single();

        if (userMembership) {
            if (userMembership.status === 'approved') {
                membership_status = 'member';
            } else if (userMembership.status === 'pending') {
                membership_status = 'pending';
            }
        }
    }

    const discoveries = confraria.discoveries.map((d: any) => ({
        ...d,
        confrariaId: d.confraria_id,
        imageUrl: d.image_url,
        imageHint: d.image_hint,
        contextualData: {
            address: d.address,
            website: d.website,
            phone: d.phone
        },
        confrarias: d.confrarias ? { ...d.confrarias, sealUrl: d.confrarias.seal_url, sealHint: d.confrarias.seal_hint } : undefined,
        seal_count: d.discovery_seal_counts[0]?.seal_count || 0,
        user_has_sealed: false, 
    })) as unknown as Discovery[];

    return {
        ...confraria,
        sealUrl: confraria.seal_url,
        sealHint: confraria.seal_hint,
        discoveries,
        member_count: confraria.confraria_members.filter((m: any) => m.status === 'approved').length,
        membership_status,
    } as ConfrariaDetails;
}


export default async function ConfrariaPage({ params }: ConfrariaPageProps) {
    const confraria = await getConfrariaDetails(params.confrariaId);
    const supabase = createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!confraria) {
        notFound();
    }
    
    const MembershipButton = () => {
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
                                <Calendar className="h-8 w-8 text-primary/80"/>
                                Próximos Eventos
                            </h2>
                             <Card className="border-l-4 border-primary">
                                <CardContent className="p-6 text-center text-muted-foreground">
                                    De momento, não existem eventos agendados.
                                </CardContent>
                            </Card>
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
                         <Card>
                            <CardHeader>
                                <CardTitle className="font-headline text-2xl flex items-center gap-3">
                                    <Feather className="h-6 w-6 text-primary/80"/>
                                    A Nossa História
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="font-body text-foreground/90">
                                <p>Preserva as receitas secretas dos conventos, doçaria que é património imaterial da nação.</p>
                            </CardContent>
                        </Card>
                         <Card>
                            <CardHeader>
                                <CardTitle className="font-headline text-2xl flex items-center gap-3">
                                    <Users className="h-6 w-6 text-primary/80"/>
                                    Fundadores
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="font-body text-foreground/90">
                                <p>Informação de fundadores em breve.</p>
                            </CardContent>
                        </Card>
                    </aside>
                </div>
            </div>
        </div>
    );
}

