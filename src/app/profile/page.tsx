

import { createServerClient } from '@/lib/supabase/server';
import { notFound, redirect } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Award, FileText, BarChart2, Pencil } from 'lucide-react';
import { getUserRank, type Discovery, type Submission, type UserRankInfo } from '@/lib/data';
import Link from 'next/link';
import { DiscoveryCard } from '@/components/discovery-card';
import { cn } from '@/lib/utils';
import { ProfileRegionChart } from './profile-region-chart';
import type { User } from '@supabase/supabase-js';
import { Button } from '@/components/ui/button';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';

async function getSealedDiscoveriesForUser(userId: string): Promise<Discovery[]> {
    const supabase = createServerClient();
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
        .select(`
            *,
            confrarias (id, name, seal_url, seal_hint),
            discovery_images(image_url, image_hint),
            discovery_seal_counts (seal_count),
            discovery_types (name)
        `)
        .in('id', discoveryIds);

     if (error) {
        console.error('Error fetching sealed discoveries:', JSON.stringify(error, null, 2));
        return [];
    }

    const userSeals = new Set(discoveryIds);
    
    return data.map((d: any) => {
       const images = (d.discovery_images || []).map((img: any) => ({
            imageUrl: img.image_url,
            imageHint: img.image_hint,
        }));
      return {
        ...d,
        type: d.discovery_types.name,
        confrariaId: d.confraria_id,
        imageUrl: images[0]?.imageUrl || 'https://placehold.co/600x400.png',
        imageHint: images[0]?.imageHint || 'placeholder',
        images: images,
        confrarias: d.confrarias ? { ...d.confrarias, sealUrl: d.confrarias.seal_url, sealHint: d.confrarias.seal_hint } : undefined,
        seal_count: d.discovery_seal_counts[0]?.seal_count || 0,
        user_has_sealed: userSeals.has(d.id),
    }}) as unknown as Discovery[];
}

async function getSubmissionsForUser(userId: string): Promise<Submission[]> {
    const supabase = createServerClient();
    if (!userId) {
        return [];
    }
    const { data, error } = await supabase.from('submissions').select('*, discovery_types(name)').eq('user_id', userId).order('date', { ascending: false });
    
    if (error) {
        console.error('Error fetching submissions for user:', JSON.stringify(error, null, 2));
        return [];
    }

    return data.map((s: any) => ({
        ...s,
        discovery_title: s.discovery_title,
        discoveryTitle: s.discovery_title, // compatibility
        type: s.discovery_types?.name || 'Tipo Desconhecido',
    })) as Submission[];
}

function processRegionData(discoveries: Discovery[]) {
    if (!discoveries || discoveries.length === 0) return [];
    const regionCounts = discoveries.reduce((acc, discovery) => {
        const district = discovery.district;
        if (!acc[district]) {
            acc[district] = { district, selos: 0 };
        }
        acc[district].selos += 1;
        return acc;
    }, {} as Record<string, { district: string; selos: number }>);

    return Object.values(regionCounts).sort((a, b) => b.selos - a.selos);
}

export default async function ProfilePage() {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const [sealedDiscoveries, userSubmissions] = await Promise.all([
    getSealedDiscoveriesForUser(user.id),
    getSubmissionsForUser(user.id),
  ]);

  const approvedSubmissionsCount = userSubmissions.filter(s => s.status === 'Aprovado').length;
  const sealedDiscoveriesCount = sealedDiscoveries.length;
  const rankInfo = getUserRank(sealedDiscoveriesCount, approvedSubmissionsCount, user.user_metadata?.rank_override);
  const { rankName } = rankInfo;
  const RankIcon = rankInfo.rankIcon;

  const userFullName = user.user_metadata?.full_name || 'Confrade Anónimo';
  const userDistrict = user.user_metadata?.district || 'Distrito Desconhecido';
  const userInitial = userFullName.charAt(0).toUpperCase();

  const chartData = processRegionData(sealedDiscoveries);

  return (
    <div className="container mx-auto px-4 py-8 md:py-16">
        <div className="flex flex-col md:flex-row items-center gap-6 mb-12">
            <Avatar className="h-28 w-28 border-4 border-primary/50">
              <AvatarImage src={user.user_metadata?.avatar_url} alt={userFullName} />
              <AvatarFallback className="bg-primary/20 text-primary font-bold text-4xl">{userInitial}</AvatarFallback>
            </Avatar>
            <div>
                <h1 className="font-headline text-4xl md:text-5xl font-bold">{userFullName}</h1>
                <Badge variant="secondary" className="mt-2 text-base font-semibold flex items-center gap-2 w-fit px-4 py-1">
                    <RankIcon className="h-5 w-5 text-primary" />
                    <span>{rankName}</span>
                </Badge>
                <p className="text-lg text-muted-foreground mt-2">{user.email}</p>
                <Badge variant="outline" className="mt-2 flex items-center justify-center gap-2 w-fit">
                    <MapPin className="h-4 w-4" />
                    <span>Confrade do distrito de {userDistrict}</span>
              </Badge>
            </div>
        </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Selos Concedidos</CardTitle>
                    <Award className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{sealedDiscoveriesCount}</div>
                    <p className="text-xs text-muted-foreground">descobertas que você aprovou</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Submissões Aprovadas</CardTitle>
                    <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{approvedSubmissionsCount}</div>
                    <p className="text-xs text-muted-foreground">de {userSubmissions.length} contribuições totais</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Distrito Favorito</CardTitle>
                    <BarChart2 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{chartData[0]?.district || 'N/A'}</div>
                    <p className="text-xs text-muted-foreground">com base nos seus selos</p>
                </CardContent>
            </Card>
      </div>

      <div className="space-y-8">
            <Card>
                <CardHeader>
                    <CardTitle className="font-headline text-3xl flex items-center gap-3">
                        <Award className="h-7 w-7 text-primary"/>
                        Minhas Descobertas Seladas
                    </CardTitle>
                    <CardDescription>
                        As descobertas que você visitou, provou e aprovou com o seu selo de confrade.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {sealedDiscoveries.length > 0 ? (
                         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {sealedDiscoveries.map(discovery => (
                                <DiscoveryCard key={discovery.id} discovery={discovery} />
                            ))}
                        </div>
                    ) : (
                        <p className="text-muted-foreground">Você ainda não concedeu nenhum selo. Explore as <Link href="/discoveries" className="text-primary hover:underline">descobertas</Link> e comece a sua jornada!</p>
                    )}
                </CardContent>
            </Card>

             <Card>
                <CardHeader>
                    <CardTitle className="font-headline text-3xl flex items-center gap-3">
                        <BarChart2 className="h-7 w-7 text-primary"/>
                        Selos por Distrito
                    </CardTitle>
                    <CardDescription>
                       Uma visão geral das suas explorações por todo o país.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                     {chartData.length > 0 ? (
                        <ProfileRegionChart data={chartData} />
                     ) : (
                         <p className="text-muted-foreground">Conceda selos para ver as suas estatísticas por distrito.</p>
                     )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                     <CardTitle className="font-headline text-3xl flex items-center gap-3">
                        <FileText className="h-7 w-7 text-primary"/>
                        Minhas Submissões
                    </CardTitle>
                    <CardDescription>
                        O seu historial de contribuições para a comunidade. Vá a <Link href="/submit" className="text-primary hover:underline">Partilhar Descoberta</Link> para fazer uma nova submissão.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                     {userSubmissions.length > 0 ? (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Título</TableHead>
                                    <TableHead>Data</TableHead>
                                    <TableHead>Estado</TableHead>
                                    <TableHead className="text-right">Ações</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {userSubmissions.map((submission) => (
                                    <TableRow key={submission.id}>
                                        <TableCell className="font-medium">{submission.discovery_title}</TableCell>
                                        <TableCell>{new Date(submission.date).toLocaleDateString()}</TableCell>
                                        <TableCell>
                                            <Badge
                                                className={cn({
                                                    'bg-green-100 text-green-800 border-green-300': submission.status === 'Aprovado',
                                                    'bg-red-100 text-red-800 border-red-300': submission.status === 'Rejeitado',
                                                    'bg-yellow-100 text-yellow-800 border-yellow-300': submission.status === 'Pendente',
                                                })}
                                                variant="outline"
                                            >
                                                {submission.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {submission.status === 'Pendente' && (
                                                <Button asChild variant="outline" size="sm">
                                                    <Link href={`/profile/submission/${submission.id}/edit`}>
                                                        <Pencil className="mr-2 h-4 w-4" /> Editar
                                                    </Link>
                                                </Button>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                     ) : (
                         <p className="text-muted-foreground text-center py-6">Você ainda não fez nenhuma submissão. Tem um tesouro para <Link href="/submit" className="text-primary hover:underline">partilhar</Link>?</p>
                     )}
                </CardContent>
            </Card>
        </div>
    </div>
  );
}
