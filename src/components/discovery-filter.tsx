

'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Shuffle, X, Filter as FilterIcon } from 'lucide-react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { type Discovery, type DiscoveryType } from '@/lib/data';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Separator } from './ui/separator';
import { cn } from '@/lib/utils';

interface DiscoveryFilterProps {
  districts: readonly string[];
  discoveryTypes: DiscoveryType[];
  allDiscoveries: Discovery[];
}

export function DiscoveryFilter({ districts, discoveryTypes, allDiscoveries }: DiscoveryFilterProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [district, setDistrict] = useState(searchParams.get('district') || 'all');
  const [type, setType] = useState(searchParams.get('type') || 'all');
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    // When params change in URL, update the state
    setSearchTerm(searchParams.get('search') || '');
    setDistrict(searchParams.get('district') || 'all');
    setType(searchParams.get('type') || 'all');
  }, [searchParams]);

  useEffect(() => {
    if (!isMounted) return;

    const params = new URLSearchParams(searchParams.toString());
    
    // This effect runs debounced to avoid too many redirects
    const timeoutId = setTimeout(() => {
        if (searchTerm) {
            params.set('search', searchTerm);
        } else {
            params.delete('search');
        }
        if (district && district !== 'all') {
            params.set('district', district);
        } else {
            params.delete('district');
        }
        if (type && type !== 'all') {
            params.set('type', type);
        } else {
            params.delete('type');
        }
        
        // Only push if the params have changed
        if (params.toString() !== searchParams.toString()){
             router.push(`${pathname}?${params.toString()}`);
        }
    }, 500); // 500ms debounce

    return () => clearTimeout(timeoutId);
  }, [searchTerm, district, type, router, pathname, isMounted, searchParams]);

  const handleClear = () => {
    setSearchTerm('');
    setDistrict('all');
    setType('all');
    router.push(pathname);
  };

  const handleSurprise = () => {
    if (allDiscoveries.length > 0) {
      const randomDiscovery = allDiscoveries[Math.floor(Math.random() * allDiscoveries.length)];
      router.push(`/discoveries/${randomDiscovery.slug}`);
    }
  };
  
  if (!isMounted) {
    return (
        <Card>
            <CardHeader><CardTitle>A carregar filtros...</CardTitle></CardHeader>
        </Card>
    ); 
  }

  return (
    <Card className="p-4">
        <CardHeader className="p-2">
            <CardTitle className="font-headline text-2xl flex items-center gap-2">
                <FilterIcon className="h-5 w-5"/>
                Filtros
            </CardTitle>
        </CardHeader>
        <CardContent className="p-2 space-y-6">
            <div className="space-y-2">
                <label className="text-sm font-medium">Pesquisar</label>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                    placeholder="Ex: Vinho do Porto..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="pl-10"
                    />
                </div>
            </div>
            <div className="space-y-2">
                <label className="text-sm font-medium">Distrito</label>
                <Select value={district} onValueChange={setDistrict}>
                    <SelectTrigger>
                    <SelectValue placeholder="Todos os distritos" />
                    </SelectTrigger>
                    <SelectContent>
                    <SelectItem value="all">Todos os distritos</SelectItem>
                    {districts.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                    </SelectContent>
                </Select>
            </div>
             <div className="space-y-2">
                <label className="text-sm font-medium">Tipo</label>
                <div className="flex flex-col space-y-1 text-sm text-muted-foreground">
                    <button
                        onClick={() => setType('all')}
                        className={cn(
                            'w-full text-left px-3 py-2 rounded-md transition-colors font-medium',
                            type === 'all' ? 'bg-primary/10 text-primary' : 'hover:bg-accent/50'
                        )}
                    >
                        Todos os tipos
                    </button>
                    {discoveryTypes.map(t => (
                        <button
                            key={t.name}
                            onClick={() => setType(t.name)}
                            className={cn(
                                'w-full text-left px-3 py-2 rounded-md transition-colors font-medium',
                                type === t.name ? 'bg-primary/10 text-primary' : 'hover:bg-accent/50'
                            )}
                        >
                            {t.name}
                        </button>
                    ))}
                </div>
            </div>
            <Separator/>
            <div className="space-y-2">
                <Button onClick={handleClear} variant="ghost" className="w-full justify-start text-muted-foreground">
                    <X className="mr-2 h-4 w-4"/> Limpar Filtros
                </Button>
                <Button onClick={handleSurprise} variant="secondary" className="w-full">
                    <Shuffle className="mr-2 h-4 w-4" />
                    Surpreenda-me
                </Button>
            </div>
        </CardContent>
    </Card>
  );
}
