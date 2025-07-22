
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MapPin, X } from 'lucide-react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';

interface EventFilterProps {
  regions: readonly string[];
}

export function EventFilter({ regions }: EventFilterProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  const [region, setRegion] = useState(searchParams.get('region') || '');
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);
  
  // This effect updates the URL whenever the region filter changes.
  useEffect(() => {
    if (!isMounted) return;
    
    const params = new URLSearchParams(searchParams);
    if (region) {
      params.set('region', region);
    } else {
      params.delete('region');
    }
    // We use a timeout to avoid making too many requests while the user is interacting
    const timeoutId = setTimeout(() => {
        router.push(`${pathname}?${params.toString()}`);
    }, 300);

    return () => clearTimeout(timeoutId);

  }, [region, isMounted, pathname, router]);

  const handleClear = () => {
    setRegion('');
    router.push(pathname);
  };
  
  if (!isMounted) {
    return null; // Or a loading skeleton
  }

  return (
    <div className="bg-card p-4 rounded-lg border">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
        <div className="md:col-span-2">
          <label className="text-sm font-medium mb-1 block">Filtrar por Região</label>
           <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Select value={region} onValueChange={(value) => setRegion(value === 'all' ? '' : value)}>
                <SelectTrigger className="pl-10">
                <SelectValue placeholder="Todas as regiões" />
                </SelectTrigger>
                <SelectContent>
                <SelectItem value="all">Todas as regiões</SelectItem>
                {regions.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                </SelectContent>
            </Select>
           </div>
        </div>
        <div>
            <Button onClick={handleClear} variant="ghost" className="w-full">
                <X className="mr-2 h-4 w-4"/>
                Limpar Filtro
            </Button>
        </div>
      </div>
    </div>
  );
}
