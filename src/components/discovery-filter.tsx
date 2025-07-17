
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Shuffle, X } from 'lucide-react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { type Discovery } from '@/lib/data';

interface DiscoveryFilterProps {
  regions: string[];
  discoveryTypes: string[];
  allDiscoveries: Discovery[];
}

export function DiscoveryFilter({ regions, discoveryTypes, allDiscoveries }: DiscoveryFilterProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [region, setRegion] = useState(searchParams.get('region') || '');
  const [type, setType] = useState(searchParams.get('type') || '');
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleFilter = () => {
    const params = new URLSearchParams(searchParams);
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
    router.push(`${pathname}?${params.toString()}`);
  };

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
    return null; // Or a loading skeleton
  }

  return (
    <div className="bg-card p-4 rounded-lg border mb-12 sticky top-20 z-40">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
        <div className="lg:col-span-2">
          <label className="text-sm font-medium mb-1 block">Pesquisar</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Ex: Vinho do Porto, azeite..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleFilter()}
              className="pl-10"
            />
          </div>
        </div>
        <div>
          <label className="text-sm font-medium mb-1 block">Região</label>
          <Select value={region} onValueChange={(value) => setRegion(value === 'all' ? '' : value)}>
            <SelectTrigger>
              <SelectValue placeholder="Todas as regiões" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as regiões</SelectItem>
              {regions.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-sm font-medium mb-1 block">Tipo</label>
          <Select value={type} onValueChange={(value) => setType(value === 'all' ? '' : value)}>
            <SelectTrigger>
              <SelectValue placeholder="Todos os tipos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os tipos</SelectItem>
              {discoveryTypes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleFilter} className="w-full">Filtrar</Button>
          <Button onClick={handleClear} variant="ghost" size="icon" title="Limpar Filtros"><X className="h-4 w-4"/></Button>
        </div>
      </div>
      <div className="mt-4 flex justify-center">
          <Button onClick={handleSurprise} variant="secondary">
              <Shuffle className="mr-2 h-4 w-4" />
              Surpreenda-me
          </Button>
      </div>
    </div>
  );
}
