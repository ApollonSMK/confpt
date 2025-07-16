import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SubmissionForm } from '@/components/submission-form';
import { Card, CardDescription, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { getSubmissions, getConfrarias } from '@/lib/data';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export default async function SubmitPage() {
  const userSubmissions = await getSubmissions();
  const confrarias = await getConfrarias();

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
              <SubmissionForm confrarias={confrarias} />
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
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
