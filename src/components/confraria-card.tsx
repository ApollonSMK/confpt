import Image from 'next/image';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { type Confraria } from '@/lib/data';
import { MapPin, BookOpen } from 'lucide-react';
import { Badge } from './ui/badge';

interface ConfrariaCardProps {
  confraria: Confraria & { discoveryCount: number };
}

export function ConfrariaCard({ confraria }: ConfrariaCardProps) {
  return (
    <Card className="flex flex-col h-full text-center items-center p-4 transition-transform transform hover:-translate-y-1 duration-300">
      <CardHeader>
        <div className="mx-auto mb-4">
            <Image
                src={confraria.sealUrl}
                alt={`Selo da ${confraria.name}`}
                width={100}
                height={100}
                className="rounded-full bg-muted p-2 shadow-md"
                data-ai-hint={confraria.sealHint}
            />
        </div>
        <CardTitle className="font-headline text-2xl">{confraria.name}</CardTitle>
        <CardDescription className="italic text-base">&quot;{confraria.motto}&quot;</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow">
      </CardContent>
      <CardFooter className="flex justify-center gap-4 w-full">
         <Badge variant="outline" className="flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            {confraria.region}
          </Badge>
          <Badge variant="outline" className="flex items-center gap-1">
            <BookOpen className="h-3 w-3" />
            {confraria.discoveryCount} {confraria.discoveryCount === 1 ? 'descoberta' : 'descobertas'}
          </Badge>
      </CardFooter>
    </Card>
  );
}
