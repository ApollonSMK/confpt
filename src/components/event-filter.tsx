
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MapPin, X } from 'lucide-react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';

interface EventFilterProps {
  districts: readonly string[];
}

export function EventFilter({ districts }: EventFilterProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  const [district, setDistrict] = useState(searchParams.get('district') || '');
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);
  
  // This effect updates the URL whenever the district filter changes.
  useEffect(() => {
    if (!isMounted) return;
    
    const params = new URLSearchParams(searchParams.toString());
    if (district) {
      params.set('district', district);
    } else {
      params.delete('district');
    }
    // We use a timeout to avoid making too many requests while the user is interacting
    const timeoutId = setTimeout(() => {
        if(params.toString() !== searchParams.toString()){
            router.push(`${pathname}?${params.toString()}`);
        }
    }, 300);

    return () => clearTimeout(timeoutId);

  }, [district, isMounted, pathname, router, searchParams]);

  const handleClear = () => {
    setDistrict('');
    router.push(pathname);
  };
  
  if (!isMounted) {
    return null; // Or a loading skeleton
  }

  return (
    <div className="bg-card p-4 rounded-lg border">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
        <div className="md:col-span-2">
          <label className="text-sm font-medium mb-1 block">Filtrar por Distrito</label>
           <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Select value={district} onValueChange={(value) => setDistrict(value === 'all' ? '' : value)}>
                <SelectTrigger className="pl-10">
                <SelectValue placeholder="Todos os distritos" />
                </SelectTrigger>
                <SelectContent>
                <SelectItem value="all">Todos os distritos</SelectItem>
                {districts.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
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
