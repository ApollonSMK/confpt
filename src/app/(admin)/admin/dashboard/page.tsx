

import { createServerClient } from '@/lib/supabase/server';
import { createServiceRoleClient } from '@/lib/supabase/service';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import type { Submission } from '@/lib/data';
import Link from 'next/link';
import { LayoutDashboard, Users, Shield, BookOpen, BarChart3, TrendingUp } from 'lucide-react';
import { subDays, format } from 'date-fns';
import { pt } from 'date-fns/locale';
import { ActivityChart } from './activity-chart';


async function checkAdmin() {
  const supabase = createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  if (user.email !== process.env.ADMIN_EMAIL) {
    console.warn(`User ${user.email} is not the admin. Redirecting.`);
    redirect('/');
  }
  
  return user;
}

// NOTE: This is a simplified version for the dashboard. A more complete submissions
// management page can be created at /admin/submissions.
async function getPendingSubmissions(): Promise<Submission[]> {
  const supabaseService = createServiceRoleClient();

  // 1. Obter as submissões pendentes.
  const { data: submissions, error: submissionsError } = await supabaseService
    .from('submissions')
    .select('*')
    .eq('status', 'Pendente')
    .order('date', { ascending: true });

  if (submissionsError) {
    console.error(`Erro ao buscar submissões pendentes:`, JSON.stringify(submissionsError, null, 2));
    return [];
  }

  if (!submissions || submissions.length === 0) {
    return [];
  }

  // 2. Obter os IDs de todos os utilizadores das submissões encontradas.
  const userIds = [...new Set(submissions.map(s => s.user_id))];

  // 3. Obter os dados (id e email) desses utilizadores.
  const { data: users, error: usersError } = await supabaseService.rpc('get_user_emails_by_ids', { p_user_ids: userIds });


  if (usersError) {
      console.error(`Erro ao buscar utilizadores das submissões:`, JSON.stringify(usersError, null, 2));
      return submissions.map(s => ({
        ...s,
        discoveryTitle: s.discovery_title ?? 'Sem título',
        users: { email: 'Erro ao buscar utilizador' }
      })) as Submission[];
  }

  // 4. Mapear os utilizadores por ID.
  const usersById = new Map(users.map((u: any) => [u.id, u]));

  // 5. Juntar os dados.
  return submissions.map((s: any) => ({
    ...s,
    discoveryTitle: s.discovery_title ?? 'Sem título',
    users: usersById.get(s.user_id) ?? { email: 'Utilizador Desconhecido' },
  })) as Submission[];
}

async function getDashboardStats() {
    const supabaseService = createServiceRoleClient();
    const today = new Date();
    const sevenDaysAgo = subDays(today, 7).toISOString();

    const [
        { count: userCount, error: userError },
        { count: confrariaCount, error: confrariaError },
        { count: discoveryCount, error: discoveryError },
        { data: recentDiscoveries, error: recentDiscoveriesError }
    ] = await Promise.all([
        supabaseService.from('profiles').select('*', { count: 'exact', head: true }),
        supabaseService.from('confrarias').select('*', { count: 'exact', head: true }),
        supabaseService.from('discoveries').select('*', { count: 'exact', head: true }),
        supabaseService.from('discoveries').select('created_at').gte('created_at', sevenDaysAgo)
    ]);
    
    if (userError) console.error("Error fetching user count:", userError);
    if (confrariaError) console.error("Error fetching confraria count:", confrariaError);
    if (discoveryError) console.error("Error fetching discovery count:", discoveryError);
    if (recentDiscoveriesError) console.error("Error fetching recent discoveries:", recentDiscoveriesError);

    const activityData = Array.from({ length: 7 }, (_, i) => {
        const date = subDays(today, i);
        return {
            date: format(date, 'dd/MM'),
            day: format(date, 'eee', { locale: pt }),
            descobertas: 0
        };
    }).reverse();

    if (recentDiscoveries) {
        for (const discovery of recentDiscoveries) {
            const discoveryDate = format(new Date(discovery.created_at), 'dd/MM');
            const dayEntry = activityData.find(d => d.date === discoveryDate);
            if (dayEntry) {
                dayEntry.descobertas++;
            }
        }
    }


    return {
        userCount: userCount ?? 0,
        confrariaCount: confrariaCount ?? 0,
        discoveryCount: discoveryCount ?? 0,
        activityData
    };
}


export default async function AdminDashboardPage() {
  const user = await checkAdmin();
  const [pendingSubmissions, stats] = await Promise.all([
      getPendingSubmissions(),
      getDashboardStats()
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-headline text-3xl md:text-4xl font-bold">Painel Administrativo</h1>
        <p className="text-lg text-muted-foreground">
          Bem-vindo, Confrade-Mor {user.user_metadata?.full_name || user.email}.
        </p>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Utilizadores</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.userCount}</div>
            <p className="text-xs text-muted-foreground">confrades registados na plataforma</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Confrarias</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.confrariaCount}</div>
             <p className="text-xs text-muted-foreground">guardiãs da tradição</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Descobertas</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.discoveryCount}</div>
            <p className="text-xs text-muted-foreground">tesouros partilhados</p>
          </CardContent>
        </Card>
      </div>

       <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle className="font-headline text-2xl flex items-center gap-3">
              <TrendingUp className="h-6 w-6"/>
              Atividade da Semana
            </CardTitle>
            <CardDescription>Novas descobertas publicadas nos últimos 7 dias.</CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
             <ActivityChart data={stats.activityData} />
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
            <CardHeader>
                <div className="flex items-center gap-4">
                    <LayoutDashboard className="h-6 w-6" />
                    <CardTitle className="text-2xl font-headline">
                        Submissões Pendentes
                    </CardTitle>
                    {pendingSubmissions.length > 0 && <Badge variant="destructive">{pendingSubmissions.length} Pendentes</Badge>}
                </div>
            <CardDescription>
                Rever e aprovar as descobertas submetidas pela comunidade.
            </CardDescription>
            </CardHeader>
            <CardContent>
            {pendingSubmissions.length > 0 ? (
                <Table>
                <TableHeader>
                    <TableRow>
                    <TableHead>Descoberta</TableHead>
                    <TableHead>Autor</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {pendingSubmissions.map((submission) => (
                    <TableRow key={submission.id}>
                        <TableCell className="font-medium">{submission.discoveryTitle}</TableCell>
                        <TableCell className="text-muted-foreground truncate max-w-[100px]">{submission.users?.email}</TableCell>
                        <TableCell className="text-right">
                        <Button asChild variant="outline" size="sm">
                            <Link href={`/admin/dashboard/review/${submission.id}`}>
                            Rever
                            </Link>
                        </Button>
                        </TableCell>
                    </TableRow>
                    ))}
                </TableBody>
                </Table>
            ) : (
                <div className="text-center py-12 text-muted-foreground">
                <p className="font-semibold text-lg">Tudo em ordem!</p>
                <p>Não há nenhuma submissão pendente de revisão.</p>
                </div>
            )}
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
