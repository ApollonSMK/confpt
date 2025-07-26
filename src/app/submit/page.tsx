
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SubmissionForm } from '@/components/submission-form';
import { Card, CardDescription, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import type { Submission, Confraria, DiscoveryType } from '@/lib/data';
import { createServiceRoleClient } from '@/lib/supabase/service';

async function getSubmissionsForUser(userId: string): Promise<Submission[]> {
    if (!userId) {
        console.warn('No userId provided to getSubmissionsForUser');
        return [];
    }
    const supabase = createServerClient();
    const { data, error } = await supabase.from('submissions').select('*').eq('user_id', userId).order('date', { ascending: false });
    
    if (error) {
        console.error('Error fetching submissions for user:', error);
        return [];
    }

    return data.map(s => ({
        ...s,
        discoveryTitle: s.discovery_title,
    })) as Submission[];
}


async function getConfrarias(): Promise<(Confraria & { discoveryCount: number })[]> {
    const supabase = createServerClient();
    const { data, error } = await supabase
        .from('confrarias')
        .select(`
            *,
            discoveries (
                id
            )
        `);

    if (error) {
        console.error('Error fetching confrarias:', error);
        return [];
    }
    
    return data.map(c => ({
        ...c,
        sealUrl: c.seal_url,
        sealHint: c.seal_hint,
        discoveryCount: c.discoveries.length
    })) as (Confraria & { discoveryCount: number })[];
}

async function getDiscoveryTypes(): Promise<DiscoveryType[]> {
    const supabase = createServiceRoleClient();
    const { data, error } = await supabase.from('discovery_types').select('*').order('name');
    if (error) {
        console.error("Error fetching discovery types for submit form:", error);
        return [];
    }
    return data as DiscoveryType[];
}

export default async function SubmitPage() {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const [userSubmissions, confrarias, discoveryTypes] = await Promise.all([
    getSubmissionsForUser(user.id),
    getConfrarias(),
    getDiscoveryTypes()
  ]);

  return (
    <div className="container mx-auto px-4 py-8 md:py-16">
      <div className="max-w-4xl mx-auto">
        <h1 className="font-headline text-4xl md:text-5xl font-bold mb-4 text-center">Partilhe uma Descoberta</h1>
        <p className="text-lg text-muted-foreground text-center mb-10">
          Ajude a enriquecer o nosso mapa de tesouros. Sugira um produto, lugar ou pessoa que mereça ser conhecido.
        </p>

        <Tabs defaultValue="suggest" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="suggest">Sugerir Descoberta</TabsTrigger>
            <TabsTrigger value="submissions">Minhas Submissões</TabsTrigger>
          </TabsList>
          <TabsContent value="suggest">
            <Card>
              <CardHeader>
                <CardTitle className="font-headline text-2xl">Nova Sugestão</CardTitle>
                <CardDescription>
                  Preencha os detalhes abaixo. A sua sugestão será revista pela nossa equipa.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <SubmissionForm confrarias={confrarias} discoveryTypes={discoveryTypes} />
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="submissions">
            <Card>
              <CardHeader>
                <CardTitle className="font-headline text-2xl">Histórico de Submissões</CardTitle>
                <CardDescription>
                  Acompanhe o estado das suas sugestões.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {userSubmissions.length > 0 ? (
                   <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Descoberta</TableHead>
                        <TableHead>Data</TableHead>
                        <TableHead className="text-right">Estado</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {userSubmissions.map((submission) => (
                        <TableRow key={submission.id}>
                          <TableCell className="font-medium">{submission.discoveryTitle}</TableCell>
                          <TableCell>{new Date(submission.date).toLocaleDateString()}</TableCell>
                          <TableCell className="text-right">
                            <Badge
                              className={cn({
                                'bg-green-700 text-white': submission.status === 'Aprovado',
                                'bg-red-700 text-white': submission.status === 'Rejeitado',
                              })}
                              variant={submission.status === 'Aprovado' ? 'default' : submission.status === 'Rejeitado' ? 'destructive' : 'secondary'}
                            >
                              {submission.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <p className="text-muted-foreground text-center py-8">
                    Você ainda não fez nenhuma submissão. Tem um tesouro para <Link href="/submit" className="text-primary hover:underline">partilhar</Link>?
                  </p>
                )}
                
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
