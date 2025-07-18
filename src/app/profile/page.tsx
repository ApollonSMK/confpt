import { createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, User, Award, FileText } from 'lucide-react';
import { getSealedDiscoveriesForUser, getUserSubmissions } from './actions';
import Link from 'next/link';
import Image from 'next/image';
import { DiscoveryCard } from '@/components/discovery-card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from '@/lib/utils';

export default async function ProfilePage() {
  const supabase = createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const [sealedDiscoveries, userSubmissions] = await Promise.all([
    getSealedDiscoveriesForUser(user.id),
    getUserSubmissions(user.id)
  ]);

  const userFullName = user.user_metadata?.full_name || 'Confrade Anónimo';
  const userRegion = user.user_metadata?.region || 'Região Desconhecida';
  const userInitial = userFullName.charAt(0).toUpperCase();

  return (
    <div className="container mx-auto px-4 py-8 md:py-16">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="md:col-span-1">
          <Card>
            <CardHeader className="items-center text-center">
              <Avatar className="h-24 w-24 mb-4 border-4 border-primary/50">
                <AvatarImage src={user.user_metadata?.avatar_url} alt={userFullName} />
                <AvatarFallback className="bg-primary/20 text-primary font-bold text-3xl">{userInitial}</AvatarFallback>
              </Avatar>
              <CardTitle className="font-headline text-2xl">{userFullName}</CardTitle>
              <CardDescription>{user.email}</CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Badge variant="outline" className="flex items-center justify-center gap-2">
                <MapPin className="h-4 w-4" />
                <span>{userRegion}</span>
              </Badge>
            </CardContent>
          </Card>
        </div>
        <div className="md:col-span-3 space-y-8">
            <Card>
                <CardHeader>
                    <CardTitle className="font-headline text-3xl flex items-center gap-3">
                        <Award className="h-7 w-7 text-primary"/>
                        Meus Selos Concedidos
                    </CardTitle>
                    <CardDescription>
                        As descobertas que você visitou, provou e aprovou com o seu selo de confrade.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {sealedDiscoveries.length > 0 ? (
                         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {sealedDiscoveries.map(discovery => (
                                <DiscoveryCard key={discovery.id} discovery={discovery} />
                            ))}
                        </div>
                    ) : (
                        <p className="text-muted-foreground">Você ainda não concedeu nenhum selo. Explore as <Link href="/discoveries" className="text-primary hover:underline">descobertas</Link> e comece a sua jornada!</p>
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                     <CardTitle className="font-headline text-3xl flex items-center gap-3">
                        <FileText className="h-7 w-7 text-primary"/>
                        Minhas Submissões
                    </CardTitle>
                    <CardDescription>
                        O seu historial de contribuições para a comunidade.
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
                         <p className="text-muted-foreground">Você ainda não fez nenhuma submissão. Tem um tesouro para <Link href="/submit" className="text-primary hover:underline">partilhar</Link>?</p>
                     )}
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}
