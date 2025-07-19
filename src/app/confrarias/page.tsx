import { ConfrariaCard } from "@/components/confraria-card";
import { createServerClient } from "@/lib/supabase/server";
import type { Confraria } from "@/lib/data";

async function getConfrarias(): Promise<(Confraria & { discoveryCount: number })[]> {
    const supabase = createServerClient();
    const { data, error } = await supabase
        .from('confrarias')
        .select(`
            *,
            discoveries (
                id
            )
        `);

    if (error) {
        console.error('Error fetching confrarias:', error);
        return [];
    }
    
    return data.map(c => ({
        ...c,
        sealUrl: c.seal_url,
        sealHint: c.seal_hint,
        discoveryCount: c.discoveries.length
    })) as (Confraria & { discoveryCount: number })[];
}

export default async function ConfrariasPage() {
    const confrarias = await getConfrarias();

  return (
    <div className="container mx-auto px-4 py-8 md:py-16">
      <h1 className="font-headline text-4xl md:text-5xl font-bold mb-4 text-center">
        As Nossas Confrarias
      </h1>
      <p className="text-lg text-muted-foreground text-center mb-12 max-w-2xl mx-auto">
        As guardiãs da tradição e do sabor. Conheça as irmandades que partilham o seu conhecimento e paixão por Portugal.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {confrarias.map((confraria) => (
          <ConfrariaCard key={confraria.id} confraria={confraria} />
        ))}
      </div>
    </div>
  );
}
