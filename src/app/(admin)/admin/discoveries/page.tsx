

import { createServerClient } from '@/lib/supabase/server';
import { createServiceRoleClient } from '@/lib/supabase/service';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import type { Discovery } from '@/lib/data';
import Link from 'next/link';
import { BookOpen, PlusCircle, Pencil } from 'lucide-react';
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

async function getAllDiscoveries(): Promise<Discovery[]> {
  const supabaseService = createServiceRoleClient();
  const { data, error } = await supabaseService.from('discoveries').select('*, confrarias(name), discovery_types(name)').order('title');
  if (error) {
    console.error('Error fetching discoveries for admin list:', JSON.stringify(error, null, 2));
    return [];
  }
  return data.map((d: any) => ({
      ...d, 
      type: d.discovery_types.name, 
      confrarias: d.confrarias || undefined 
    })) as Discovery[];
}

export default async function AdminDiscoveriesPage() {
  await checkAdmin();
  const discoveries = await getAllDiscoveries();

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
            <CardTitle className="font-headline text-3xl flex items-center gap-3">
                <BookOpen className="h-8 w-8 text-primary"/>
                Gerir Descobertas
            </CardTitle>
            <CardDescription>
            Adicione, edite ou remova descobertas publicadas.
            </CardDescription>
        </div>
        <Button asChild>
            <Link href="/admin/discoveries/new">
                <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Descoberta
            </Link>
        </Button>
      </CardHeader>
      <CardContent>
        {discoveries.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Título</TableHead>
                <TableHead>Região</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Confraria</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {discoveries.map((discovery) => (
                <TableRow key={discovery.id}>
                  <TableCell className="font-medium">{discovery.title}</TableCell>
                  <TableCell><Badge variant="secondary">{discovery.region}</Badge></TableCell>
                   <TableCell><Badge variant="outline">{discovery.type}</Badge></TableCell>
                   <TableCell className="text-muted-foreground">{discovery.confrarias?.name ?? 'Comunitário'}</TableCell>
                  <TableCell className="text-right">
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/admin/discoveries/${discovery.id}/edit`}>
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
            <p className="font-semibold text-lg">Nenhuma descoberta encontrada.</p>
            <p>Comece por <Link href="/admin/discoveries/new" className="text-primary hover:underline">adicionar a primeira</Link>.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
