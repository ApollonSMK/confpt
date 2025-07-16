'use client';

import { useState } from 'react';
import { DiscoveryCard } from '@/components/discovery-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { discoveries as allDiscoveries, regions, discoveryTypes } from '@/lib/data';
import { Search, Shuffle, X } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function DiscoveriesPage() {
  const [discoveries, setDiscoveries] = useState(allDiscoveries);
  const [searchTerm, setSearchTerm] = useState('');
  const [region, setRegion] = useState('');
  const [type, setType] = useState('');
  const router = useRouter();

  const handleFilter = () => {
    let filtered = allDiscoveries;

    if (searchTerm) {
      filtered = filtered.filter(d =>
        d.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    if (region) {
      filtered = filtered.filter(d => d.region === region);
    }
    if (type) {
      filtered = filtered.filter(d => d.type === type);
    }
    setDiscoveries(filtered);
  };

  const handleClear = () => {
    setSearchTerm('');
    setRegion('');
    setType('');
    setDiscoveries(allDiscoveries);
  };

  const handleSurprise = () => {
    const randomDiscovery = allDiscoveries[Math.floor(Math.random() * allDiscoveries.length)];
    router.push(`/discoveries/${randomDiscovery.slug}`);
  };

  return (
    <div className="container mx-auto px-4 py-8 md:py-16">
      <h1 className="font-headline text-4xl md:text-5xl font-bold mb-4 text-center">Explorar Descobertas</h1>
      <p className="text-lg text-muted-foreground text-center mb-10 max-w-2xl mx-auto">
        Filtre por região, tipo ou palavra-chave para encontrar os tesouros escondidos de Portugal.
      </p>

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
                className="pl-10"
              />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Região</label>
            <Select value={region} onValueChange={setRegion}>
              <SelectTrigger>
                <SelectValue placeholder="Todas as regiões" />
              </SelectTrigger>
              <SelectContent>
                {regions.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Tipo</label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger>
                <SelectValue placeholder="Todos os tipos" />
              </SelectTrigger>
              <SelectContent>
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {discoveries.map(discovery => (
          <DiscoveryCard key={discovery.id} discovery={discovery} />
        ))}
      </div>
      {discoveries.length === 0 && (
        <div className="text-center col-span-full py-16">
            <p className="text-muted-foreground text-lg">Nenhuma descoberta encontrada. Tente alargar os seus critérios de pesquisa.</p>
        </div>
      )}
    </div>
  );
}
