
import { createServerClient } from '@/lib/supabase/server';
import { createServiceRoleClient } from '@/lib/supabase/service';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import type { Confraria } from '@/lib/data';
import Link from 'next/link';
import { Shield, PlusCircle, Pencil } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';

async function checkAdmin() {
  const supabase = createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || user.email !== process.env.ADMIN_EMAIL) {
    redirect('/login');
  }
}

async function getAllConfrarias(): Promise<Confraria[]> {
  const supabaseService = createServiceRoleClient();
  const { data, error } = await supabaseService.from('confrarias').select('*').order('name');
  if (error) {
    console.error('Error fetching confrarias for admin list:', error);
    return [];
  }
  return data as Confraria[];
}

export default async function AdminConfrariasPage() {
  await checkAdmin();
  const confrarias = await getAllConfrarias();

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
            <CardTitle className="font-headline text-3xl flex items-center gap-3">
                <Shield className="h-8 w-8 text-primary"/>
                Gerir Confrarias
            </CardTitle>
            <CardDescription>
            Adicione, edite ou remova confrarias da plataforma.
            </CardDescription>
        </div>
        <Button asChild>
            <Link href="/admin/confrarias/new">
                <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Confraria
            </Link>
        </Button>
      </CardHeader>
      <CardContent>
        {confrarias.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Confraria</TableHead>
                <TableHead>Localização</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {confrarias.map((confraria) => (
                <TableRow key={confraria.id}>
                  <TableCell className="font-medium flex items-center gap-3">
                    <Image src={confraria.seal_url} alt={confraria.name} width={40} height={40} className="rounded-full bg-muted p-1" data-ai-hint={confraria.seal_hint} />
                    {confraria.name}
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{confraria.district}</div>
                    <div className="text-sm text-muted-foreground">{confraria.municipality}</div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/admin/confrarias/${confraria.id}/edit`}>
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
            <p className="font-semibold text-lg">Nenhuma confraria encontrada.</p>
            <p>Comece por <Link href="/admin/confrarias/new" className="text-primary hover:underline">adicionar a primeira</Link>.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
