import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SubmissionForm } from '@/components/submission-form';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { userSubmissions } from '@/lib/data';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export default function SubmitPage() {
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
              <SubmissionForm />
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
                        <TableCell>{submission.date}</TableCell>
                        <TableCell className="text-right">
                          <Badge
                            className={cn({
                              'bg-green-600/20 text-green-800 border-green-600/30': submission.status === 'Aprovado',
                              'bg-yellow-600/20 text-yellow-800 border-yellow-600/30': submission.status === 'Pendente',
                              'bg-red-600/20 text-red-800 border-red-600/30': submission.status === 'Rejeitado',
                            })}
                            variant="outline"
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
