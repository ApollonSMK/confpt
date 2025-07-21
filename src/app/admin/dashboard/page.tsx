
import { createServerClient } from '@/lib/supabase/server';
import { createServiceRoleClient } from '@/lib/supabase/service';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import type { Submission, Confraria } from '@/lib/data';
import Link from 'next/link';
import { PlusCircle } from 'lucide-react';

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

// SOLUÇÃO DEFINITIVA: Fazer duas queries separadas e juntar na aplicação.
// Isto contorna o problema persistente de relacionamento entre esquemas (public e auth) no Supabase.
async function getSubmissionsByStatus(status: 'Pendente' | 'Aprovado' | 'Rejeitado'): Promise<Submission[]> {
  const supabaseService = createServiceRoleClient();

  // 1. Obter todas as submissões com o status desejado.
  const { data: submissions, error: submissionsError } = await supabaseService
    .from('submissions')
    .select('*')
    .eq('status', status)
    .order('date', { ascending: true });

  if (submissionsError) {
    console.error(`Erro ao buscar submissões com status "${status}":`, JSON.stringify(submissionsError, null, 2));
    return [];
  }

  if (!submissions || submissions.length === 0) {
    return [];
  }

  // 2. Obter os IDs de todos os utilizadores das submissões encontradas.
  const userIds = [...new Set(submissions.map(s => s.user_id))];

  // 3. Obter os dados (id e email) desses utilizadores usando a função RPC.
  const { data: users, error: usersError } = await supabaseService.rpc('get_user_emails_by_ids', { p_user_ids: userIds });


  if (usersError) {
      console.error(`Erro ao buscar utilizadores das submissões:`, JSON.stringify(usersError, null, 2));
      // Mesmo com erro, retornamos as submissões para não quebrar a página.
      return submissions.map(s => ({
        ...s,
        discoveryTitle: s.discovery_title ?? 'Sem título',
        users: { email: 'Erro ao buscar utilizador' }
      })) as Submission[];
  }

  // 4. Mapear os utilizadores por ID para uma busca rápida.
  const usersById = new Map(users.map((u: any) => [u.id, u]));

  // 5. Juntar os dados das submissões com os dados dos utilizadores.
  return submissions.map((s: any) => ({
    ...s,
    discoveryTitle: s.discovery_title ?? 'Sem título',
    users: usersById.get(s.user_id) ?? { email: 'Utilizador Desconhecido' },
  })) as Submission[];
}

async function getConfrarias(): Promise<Confraria[]> {
    const supabase = createServiceRoleClient();
    const { data, error } = await supabase
        .from('confrarias')
        .select('*')
        .order('name');
    
    if (error) {
        console.error('Error fetching confrarias:', error);
        return [];
    }

    return data as Confraria[];
}


export default async function AdminDashboardPage() {
  const user = await checkAdmin();
  const [pendingSubmissions, confrarias] = await Promise.all([
    getSubmissionsByStatus('Pendente'),
    getConfrarias()
  ]);

  return (
    <div className="container mx-auto px-4 py-8 md:py-16">
      <div className="max-w-6xl mx-auto space-y-10">
        <div>
          <h1 className="font-headline text-4xl md:text-5xl font-bold mb-2">Painel Administrativo</h1>
          <p className="text-lg text-muted-foreground">
            Bem-vindo, Confrade-Mor {user.user_metadata?.full_name || user.email}.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-4">
              <span>Aprovação de Submissões</span>
              {pendingSubmissions.length > 0 && <Badge variant="destructive">{pendingSubmissions.length} Pendentes</Badge>}
            </CardTitle>
            <CardDescription>
              Aqui você poderá rever e aprovar as descobertas submetidas pela comunidade.
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

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Gestor de Confrarias</CardTitle>
              <CardDescription>
                Adicione, edite ou remova as confrarias oficiais.
              </CardDescription>
            </div>
             <Button asChild>
                <Link href="/admin/confrarias/new">
                    <PlusCircle />
                    Adicionar Nova
                </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Nome da Confraria</TableHead>
                        <TableHead>Região</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {confrarias.map((confraria) => (
                        <TableRow key={confraria.id}>
                            <TableCell className="font-medium">{confraria.name}</TableCell>
                            <TableCell>{confraria.region}</TableCell>
                            <TableCell className="text-right">
                                <Button asChild variant="outline" size="sm">
                                  <Link href={`/admin/confrarias/${confraria.id}/edit`}>
                                    Editar
                                  </Link>
                                </Button>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
             {confrarias.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <p>Nenhuma confraria encontrada.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
