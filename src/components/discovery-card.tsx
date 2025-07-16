import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { type Discovery } from '@/lib/data';
import { ArrowRight, MapPin, Tag, Shield } from 'lucide-react';
import { Button } from './ui/button';

interface DiscoveryCardProps {
  discovery: Discovery;
}

export function DiscoveryCard({ discovery }: DiscoveryCardProps) {
  const confraria = discovery.confrarias;

  return (
    <Card className="flex flex-col h-full overflow-hidden transition-shadow duration-300 hover:shadow-xl border-2 border-transparent hover:border-primary/50">
      <CardHeader>
        <div className="aspect-[4/3] relative w-full overflow-hidden rounded-md mb-4">
          <Image
            src={discovery.imageUrl}
            alt={discovery.title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            data-ai-hint={discovery.imageHint}
          />
        </div>
        <CardTitle className="font-headline text-2xl">
          <Link href={`/discoveries/${discovery.slug}`} className="hover:text-primary transition-colors">
            {discovery.title}
          </Link>
        </CardTitle>
        <CardDescription className="font-body text-base pt-2">{discovery.description}</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow">
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary" className="flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            {discovery.region}
          </Badge>
          <Badge variant="secondary" className="flex items-center gap-1">
            <Tag className="h-3 w-3" />
            {discovery.type}
          </Badge>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between items-center">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {confraria && <Shield className="h-4 w-4 text-primary" />}
            <span>{confraria?.name || 'Comunitário'}</span>
        </div>
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/discoveries/${discovery.slug}`}>
             Ver mais <ArrowRight className="ml-2 h-4 w-4"/>
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
