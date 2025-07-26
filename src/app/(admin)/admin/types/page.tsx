
import { createServerClient } from '@/lib/supabase/server';
import { createServiceRoleClient } from '@/lib/supabase/service';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tag } from 'lucide-react';
import type { DiscoveryType } from '@/lib/data';
import { AddTypeForm } from './add-type-form';

async function checkAdmin() {
  const supabase = createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || user.email !== process.env.ADMIN_EMAIL) {
    redirect('/login');
  }
}

async function getDiscoveryTypes(): Promise<DiscoveryType[]> {
  const supabaseService = createServiceRoleClient();
  const { data, error } = await supabaseService.from('discovery_types').select('*').order('name');
  if (error) {
    console.error('Error fetching discovery types for admin list:', error);
    return [];
  }
  return data as DiscoveryType[];
}

export default async function AdminTypesPage() {
  await checkAdmin();
  const types = await getDiscoveryTypes();

  return (
      <div className="grid gap-8 md:grid-cols-3">
        <div className="md:col-span-2">
            <Card>
            <CardHeader>
                <CardTitle className="font-headline text-3xl flex items-center gap-3">
                    <Tag className="h-8 w-8 text-primary"/>
                    Gerir Tipos de Descoberta
                </CardTitle>
                <CardDescription>
                Visualize e remova os tipos de descoberta existentes.
                </CardDescription>
            </CardHeader>
            <CardContent>
                {types.length > 0 ? (
                <Table>
                    <TableHeader>
                    <TableRow>
                        <TableHead>Nome</TableHead>
                        {/* Ações could be here */}
                    </TableRow>
                    </TableHeader>
                    <TableBody>
                    {types.map((type) => (
                        <TableRow key={type.id}>
                        <TableCell className="font-medium">
                            {type.name}
                        </TableCell>
                        </TableRow>
                    ))}
                    </TableBody>
                </Table>
                ) : (
                <div className="text-center py-12 text-muted-foreground">
                    <p className="font-semibold text-lg">Nenhum tipo encontrado.</p>
                </div>
                )}
            </CardContent>
            </Card>
        </div>
        <div>
            <Card>
                 <CardHeader>
                    <CardTitle className="font-headline text-2xl">Adicionar Tipo</CardTitle>
                    <CardDescription>
                    Crie uma nova categoria para as descobertas.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <AddTypeForm />
                </CardContent>
            </Card>
        </div>
    </div>
  );
}
