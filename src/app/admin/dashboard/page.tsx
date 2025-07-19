
import { createServerClient } from '@/lib/supabase/server';
import { createServiceRoleClient } from '@/lib/supabase/service';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import type { Submission } from '@/lib/data';

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

async function getSubmissionsByStatus(status: 'Pendente' | 'Aprovado' | 'Rejeitado'): Promise<Submission[]> {
  const supabaseService = createServiceRoleClient(process.env.SUPABASE_SERVICE_ROLE_KEY!);

  // A correção crucial: usar a sintaxe explícita de junção (foreign key table)
  // `users:user_id(email)` ou, como alias implícito: `users:submissions_user_id_fkey(email)`
  // A sintaxe mais limpa e recomendada é `table!foreign_key_column(columns...)`
  // Neste caso, `users:user_id` é o nome da tabela e `user_id` a coluna com a FK.
  const { data, error } = await supabaseService
    .from('submissions')
    .select(`
      *,
      users:user_id (
        email
      )
    `)
    .eq('status', status)
    .order('date', { ascending: true });

  if (error) {
    console.error(`Erro ao buscar submissões com status "${status}":`, JSON.stringify(error, null, 2));
    return [];
  }

  return (data || []).map((s: any) => ({
    ...s,
    discoveryTitle: s.discovery_title ?? 'Sem título',
    users: s.users ?? { email: 'Utilizador Desconhecido' },
  })) as Submission[];
}


export default async function AdminDashboardPage() {
  const user = await checkAdmin();
  const pendingSubmissions = await getSubmissionsByStatus('Pendente');

  return (
    <div className="container mx-auto px-4 py-8 md:py-16">
      <div className="max-w-6xl mx-auto">
        <h1 className="font-headline text-4xl md:text-5xl font-bold mb-2">Painel Administrativo</h1>
        <p className="text-lg text-muted-foreground mb-10">
          Bem-vindo, Confrade-Mor {user.user_metadata?.full_name || user.email}.
        </p>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-4">
              <span>Aprovação de Submissões</span>
              <Badge variant="destructive">{pendingSubmissions.length} Pendentes</Badge>
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
                        <Button variant="outline" size="sm">
                          Rever
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
