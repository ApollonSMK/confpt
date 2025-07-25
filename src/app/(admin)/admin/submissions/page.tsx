
import { createServerClient } from '@/lib/supabase/server';
import { createServiceRoleClient } from '@/lib/supabase/service';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import type { Submission } from '@/lib/data';
import Link from 'next/link';
import { FileCheck, Pencil } from 'lucide-react';
import { cn } from '@/lib/utils';

async function checkAdmin() {
  const supabase = createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || user.email !== process.env.ADMIN_EMAIL) {
    redirect('/login');
  }
}

async function getAllSubmissions(): Promise<Submission[]> {
  const supabaseService = createServiceRoleClient();

  const { data: submissions, error: submissionsError } = await supabaseService
    .from('submissions')
    .select('*')
    .order('date', { ascending: false });

  if (submissionsError) {
    console.error(`Error fetching all submissions:`, submissionsError);
    return [];
  }

  if (!submissions || submissions.length === 0) {
    return [];
  }

  const userIds = [...new Set(submissions.map(s => s.user_id))];
  const { data: users, error: usersError } = await supabaseService.rpc('get_user_emails_by_ids', { p_user_ids: userIds });

  if (usersError) {
      console.error(`Error fetching users for submissions:`, usersError);
      return submissions.map(s => ({
        ...s,
        discoveryTitle: s.discovery_title ?? 'Sem título',
        users: { email: 'Erro ao buscar' }
      })) as Submission[];
  }

  const usersById = new Map(users.map((u: any) => [u.id, u]));

  return submissions.map((s: any) => ({
    ...s,
    discoveryTitle: s.discovery_title ?? 'Sem título',
    users: usersById.get(s.user_id) ?? { email: 'Utilizador Desconhecido' },
  })) as Submission[];
}


export default async function AdminSubmissionsPage() {
  await checkAdmin();
  const allSubmissions = await getAllSubmissions();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline text-3xl flex items-center gap-3">
            <FileCheck className="h-8 w-8 text-primary"/>
            Gerir Submissões
        </CardTitle>
        <CardDescription>
          Visualize e gira o histórico de todas as submissões da comunidade.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {allSubmissions.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Descoberta</TableHead>
                <TableHead>Autor</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {allSubmissions.map((submission) => (
                <TableRow key={submission.id}>
                  <TableCell className="font-medium">{submission.discoveryTitle}</TableCell>
                  <TableCell className="text-muted-foreground">{submission.users?.email}</TableCell>
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
                            <Link href={`/admin/dashboard/review/${submission.id}`}>
                                Rever
                            </Link>
                        </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <p className="font-semibold text-lg">Nenhuma submissão encontrada.</p>
            <p>A comunidade ainda não enviou nenhuma descoberta.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
