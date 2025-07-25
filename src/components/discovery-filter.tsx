

'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Shuffle, X, Filter as FilterIcon } from 'lucide-react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { type Discovery } from '@/lib/data';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Separator } from './ui/separator';

interface DiscoveryFilterProps {
  regions: readonly string[];
  discoveryTypes: readonly string[];
  allDiscoveries: Discovery[];
}

export function DiscoveryFilter({ regions, discoveryTypes, allDiscoveries }: DiscoveryFilterProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [region, setRegion] = useState(search_params => search_params.get('region') || '');
  const [type, setType] = useState(search_params => search_params.get('type') || '');
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    // When params change in URL, update the state
    setSearchTerm(searchParams.get('search') || '');
    setRegion(searchParams.get('region') || '');
    setType(searchParams.get('type') || '');
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
        if (region) {
            params.set('region', region);
        } else {
            params.delete('region');
        }
        if (type) {
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
  }, [searchTerm, region, type, router, pathname, isMounted]);

  const handleClear = () => {
    setSearchTerm('');
    setRegion('');
    setType('');
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
                <label className="text-sm font-medium">Região</label>
                <Select value={region} onValueChange={setRegion}>
                    <SelectTrigger>
                    <SelectValue placeholder="Todas as regiões" />
                    </SelectTrigger>
                    <SelectContent>
                    <SelectItem value="">Todas as regiões</SelectItem>
                    {regions.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                    </SelectContent>
                </Select>
            </div>
            <div className="space-y-2">
                <label className="text-sm font-medium">Tipo</label>
                <Select value={type} onValueChange={setType}>
                    <SelectTrigger>
                    <SelectValue placeholder="Todos os tipos" />
                    </SelectTrigger>
                    <SelectContent>
                    <SelectItem value="">Todos os tipos</SelectItem>
                    {discoveryTypes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                </Select>
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

