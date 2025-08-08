
import { createServerClient } from '@/lib/supabase/server';
import { createServiceRoleClient } from '@/lib/supabase/service';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Users, Pencil } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { User } from '@supabase/supabase-js';
import { getUserRank, type UserRankInfo, rankIcons } from '@/lib/data';
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

type UserWithRank = User & {
    rank: UserRankInfo;
}

async function getAllUsersWithRanks(): Promise<UserWithRank[]> {
  const supabaseService = createServiceRoleClient();
  
  const { data: authUsers, error: usersError } = await supabaseService.auth.admin.listUsers();

  if (usersError) {
      console.error('Error fetching users:', usersError);
      return [];
  }

  const { data: seals, error: sealsError } = await supabaseService
    .from('seals')
    .select('user_id', { count: 'exact' });

  const { data: submissions, error: submissionsError } = await supabaseService
    .from('submissions')
    .select('user_id', { count: 'exact' })
    .eq('status', 'Aprovado');

  if (sealsError) console.error('Error fetching seals count:', sealsError);
  if (submissionsError) console.error('Error fetching submissions count:', submissionsError);

  const sealsByUser = (seals || []).reduce((acc, { user_id }) => {
      acc[user_id] = (acc[user_id] || 0) + 1;
      return acc;
  }, {} as Record<string, number>);

  const submissionsByUser = (submissions || []).reduce((acc, { user_id }) => {
      acc[user_id] = (acc[user_id] || 0) + 1;
      return acc;
  }, {} as Record<string, number>);
  
  return authUsers.users.map((user) => {
      const sealed_discoveries_count = sealsByUser[user.id] || 0;
      const approved_submissions_count = submissionsByUser[user.id] || 0;
      const rank = getUserRank(sealed_discoveries_count, approved_submissions_count, user.user_metadata?.rank_override);
      
      return {
          ...user,
          rank
      };
  }).sort((a,b) => (new Date(a.created_at) < new Date(b.created_at)) ? 1 : -1) as UserWithRank[];
}

export default async function AdminUsersPage() {
  await checkAdmin();
  const users = await getAllUsersWithRanks();

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
            <CardTitle className="font-headline text-3xl flex items-center gap-3">
                <Users className="h-8 w-8 text-primary"/>
                Gerir Utilizadores
            </CardTitle>
            <CardDescription>
                Visualize e gira as contas dos utilizadores da plataforma.
            </CardDescription>
        </div>
        {/* Placeholder for future "Add User" button */}
      </CardHeader>
      <CardContent>
        {users.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Utilizador</TableHead>
                <TableHead>Nível</TableHead>
                <TableHead>Data de Registo</TableHead>
                <TableHead>Último Acesso</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => {
                const RankIcon = rankIcons[user.rank.rankIconName];
                return (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">
                    <div>{user.user_metadata?.full_name ?? 'N/A'}</div>
                    <div className="text-xs text-muted-foreground">{user.email}</div>
                    {user.email === process.env.ADMIN_EMAIL && <Badge className="ml-2 mt-1" variant="destructive">Admin</Badge>}
                  </TableCell>
                  <TableCell>
                      <Badge 
                        variant={user.user_metadata.rank_override ? "default" : "secondary"} 
                        className={cn("flex items-center gap-2 w-fit", {
                            'bg-[#c28a51] text-[#471F23] hover:bg-[#c28a51]/90': user.user_metadata.rank_override,
                        })}>
                          <RankIcon className="h-4 w-4" />
                          <span>{user.rank.rankName}</span>
                      </Badge>
                  </TableCell>
                  <TableCell>{new Date(user.created_at).toLocaleDateString()}</TableCell>
                  <TableCell>{user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString() : 'Nunca'}</TableCell>
                  <TableCell className="text-right">
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/admin/users/${user.id}/edit`}>
                        <Pencil className="mr-2 h-4 w-4" /> Editar
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              )})}
            </TableBody>
          </Table>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <p className="font-semibold text-lg">Nenhum utilizador encontrado.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
