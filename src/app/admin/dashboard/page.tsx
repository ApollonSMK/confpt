
import { createServerClient } from '@/lib/supabase/server';
import { createServiceRoleClient } from '@/lib/supabase/service';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import type { Submission } from '@/lib/data';
import Link from 'next/link';
import { LayoutDashboard } from 'lucide-react';

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


export default async function AdminDashboardPage() {
  const user = await checkAdmin();
  const pendingSubmissions = await getPendingSubmissions();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-headline text-3xl md:text-4xl font-bold">Painel Administrativo</h1>
        <p className="text-lg text-muted-foreground">
          Bem-vindo, Confrade-Mor {user.user_metadata?.full_name || user.email}.
        </p>
      </div>

      <Card>
        <CardHeader>
            <div className="flex items-center gap-4">
                <LayoutDashboard className="h-6 w-6" />
                <CardTitle className="text-2xl">
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
                  <TableHead>Data</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingSubmissions.map((submission) => (
                  <TableRow key={submission.id}>
                    <TableCell className="font-medium">{submission.discoveryTitle}</TableCell>
                    <TableCell className="text-muted-foreground">{submission.users?.email}</TableCell>
                    <TableCell>{new Date(submission.date).toLocaleDateString()}</TableCell>
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
      
      {/* Cards for Confrarias and Discoveries management are removed.
          This functionality will now be accessed via the new admin sidebar.
          We can later add stats cards here for a real "dashboard" feel. */}

    </div>
  );
}
