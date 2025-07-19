
'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { redirect } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Award, FileText, BarChart2 } from 'lucide-react';
import { getSealedDiscoveriesForUser, getSubmissionsForUser, getUserRank, type Discovery, type Submission, type UserRankInfo } from '@/lib/data';
import Link from 'next/link';
import { DiscoveryCard } from '@/components/discovery-card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from '@/lib/utils';
import { ProfileRegionChart } from './profile-region-chart';
import type { User } from '@supabase/supabase-js';
import { Skeleton } from '@/components/ui/skeleton';

function processRegionData(discoveries: Discovery[]) {
    if (!discoveries || discoveries.length === 0) return [];
    const regionCounts = discoveries.reduce((acc, discovery) => {
        const region = discovery.region;
        if (!acc[region]) {
            acc[region] = { region, selos: 0 };
        }
        acc[region].selos += 1;
        return acc;
    }, {} as Record<string, { region: string; selos: number }>);

    return Object.values(regionCounts).sort((a, b) => b.selos - a.selos);
}

export default function ProfilePage() {
    const [user, setUser] = useState<User | null>(null);
    const [sealedDiscoveries, setSealedDiscoveries] = useState<Discovery[]>([]);
    const [userSubmissions, setUserSubmissions] = useState<Submission[]>([]);
    const [rankInfo, setRankInfo] = useState<UserRankInfo | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const supabase = createClient();

        async function fetchData() {
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                redirect('/login');
                return;
            }
            setUser(user);

            const [sealedData, submissionsData] = await Promise.all([
                getSealedDiscoveriesForUser(user.id),
                getSubmissionsForUser(user.id),
            ]);

            setSealedDiscoveries(sealedData);
            setUserSubmissions(submissionsData);

            const approvedSubmissionsCount = submissionsData.filter(s => s.status === 'Aprovado').length;
            const sealedDiscoveriesCount = sealedData.length;
            setRankInfo(getUserRank(sealedDiscoveriesCount, approvedSubmissionsCount));

            setLoading(false);
        }

        fetchData();
    }, []);

    if (loading || !user || !rankInfo) {
        return (
            <div className="container mx-auto px-4 py-8 md:py-16">
                <div className="flex flex-col md:flex-row items-center gap-6 mb-12">
                    <Skeleton className="h-28 w-28 rounded-full" />
                    <div className="space-y-2">
                        <Skeleton className="h-10 w-64" />
                        <Skeleton className="h-8 w-40" />
                        <Skeleton className="h-6 w-80" />
                    </div>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                    <Card><CardHeader><Skeleton className="h-5 w-32 mb-2" /><Skeleton className="h-8 w-16" /></CardHeader></Card>
                    <Card><CardHeader><Skeleton className="h-5 w-32 mb-2" /><Skeleton className="h-8 w-16" /></CardHeader></Card>
                    <Card><CardHeader><Skeleton className="h-5 w-32 mb-2" /><Skeleton className="h-8 w-16" /></CardHeader></Card>
                </div>
                 <Skeleton className="h-96 w-full" />
            </div>
        );
    }
    
  const approvedSubmissionsCount = userSubmissions.filter(s => s.status === 'Aprovado').length;
  const sealedDiscoveriesCount = sealedDiscoveries.length;
  const { rankName, rankIcon: RankIcon } = rankInfo;
  
  const userFullName = user.user_metadata?.full_name || 'Confrade Anónimo';
  const userRegion = user.user_metadata?.region || 'Região Desconhecida';
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
                    <span>Confrade da região de {userRegion}</span>
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
                    <CardTitle className="text-sm font-medium">Região Favorita</CardTitle>
                    <BarChart2 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{chartData[0]?.region || 'N/A'}</div>
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
                        Selos por Região
                    </CardTitle>
                    <CardDescription>
                       Uma visão geral das suas explorações por todo o país.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                     {chartData.length > 0 ? (
                        <ProfileRegionChart data={chartData} />
                     ) : (
                         <p className="text-muted-foreground">Conceda selos para ver as suas estatísticas por região.</p>
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
                        O seu historial de contribuições para a comunidade.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                     {userSubmissions.length > 0 ? (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                <TableHead>Descoberta</TableHead>
                                <TableHead>Data</TableHead>
                                <TableHead className="text-right">Estado</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {userSubmissions.map((submission) => (
                                <TableRow key={submission.id}>
                                    <TableCell className="font-medium">{submission.discoveryTitle}</TableCell>
                                    <TableCell>{new Date(submission.date).toLocaleDateString()}</TableCell>
                                    <TableCell className="text-right">
                                    <Badge
                                        className={cn({
                                        'bg-green-700 text-white': submission.status === 'Aprovado',
                                        'bg-red-700 text-white': submission.status === 'Rejeitado',
                                        })}
                                        variant={submission.status === 'Aprovado' ? 'default' : submission.status === 'Rejeitado' ? 'destructive' : 'secondary'}
                                    >
                                        {submission.status}
                                    </Badge>
                                    </TableCell>
                                </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                     ) : (
                         <p className="text-muted-foreground">Você ainda não fez nenhuma submissão. Tem um tesouro para <Link href="/submit" className="text-primary hover:underline">partilhar</Link>?</p>
                     )}
                </CardContent>
            </Card>
        </div>
    </div>
  );
}
