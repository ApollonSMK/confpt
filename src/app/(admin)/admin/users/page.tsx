
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

async function checkAdmin() {
  const supabase = createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || user.email !== process.env.ADMIN_EMAIL) {
    redirect('/login');
  }
}

async function getAllUsers(): Promise<User[]> {
  const supabaseService = createServiceRoleClient();
  const { data, error } = await supabaseService.auth.admin.listUsers({
      page: 1,
      perPage: 1000,
  });

  if (error) {
    console.error('Error fetching users for admin list:', error);
    return [];
  }
  return data.users;
}

export default async function AdminUsersPage() {
  await checkAdmin();
  const users = await getAllUsers();

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
                <TableHead>Email</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>Data de Registo</TableHead>
                <TableHead>Último Acesso</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">
                    {user.email}
                    {user.email === process.env.ADMIN_EMAIL && <Badge className="ml-2">Admin</Badge>}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{user.user_metadata?.full_name ?? 'N/A'}</TableCell>
                  <TableCell>{new Date(user.created_at).toLocaleDateString()}</TableCell>
                  <TableCell>{user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString() : 'Nunca'}</TableCell>
                  <TableCell className="text-right">
                    <Button asChild variant="outline" size="sm" disabled>
                      <Link href={`#`}>
                        <Pencil className="mr-2 h-4 w-4" /> Editar
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
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
