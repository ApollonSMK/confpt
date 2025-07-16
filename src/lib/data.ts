import { supabase } from "./supabase";

// Tipos principais baseados no esquema do Supabase

export type Discovery = {
  id: number;
  slug: string;
  title: string;
  description: string;
  editorial: string;
  region: 'Norte' | 'Centro' | 'Lisboa' | 'Alentejo' | 'Algarve' | 'Açores' | 'Madeira';
  type: 'Produto' | 'Lugar' | 'Pessoa';
  confraria_id: number;
  image_url: string;
  image_hint: string;
  address?: string | null;
  website?: string | null;
  phone?: string | null;
  confrarias?: Confraria; // Relação opcional
};

export type Confraria = {
  id: number;
  name: string;
  motto: string;
  region: 'Norte' | 'Centro' | 'Lisboa' | 'Alentejo' | 'Algarve' | 'Açores' | 'Madeira';
  seal_url: string;
  seal_hint: string;
  discoveries?: Discovery[]; // Relação opcional
};

export type Submission = {
  id: number;
  discovery_title: string;
  date: string;
  status: 'Pendente' | 'Aprovado' | 'Rejeitado';
};


// Funções para buscar dados do Supabase

export async function getDiscoveries(): Promise<Discovery[]> {
    const { data, error } = await supabase
        .from('discoveries')
        .select(`
            *,
            confrarias (
                id,
                name
            )
        `);

    if (error) {
        console.error('Error fetching discoveries:', error);
        return [];
    }

    // O Supabase retorna a relação como um objeto, mas nosso componente espera `confrariaId`.
    // E o objeto da relação está no plural 'confrarias', vamos ajustar para o singular 'confraria'.
    // Também ajustamos o nome das colunas para corresponder ao que os componentes esperam.
    return data.map(d => ({
        ...d,
        confrariaId: d.confraria_id,
        imageUrl: d.image_url,
        imageHint: d.image_hint,
        contextualData: {
            address: d.address,
            website: d.website,
            phone: d.phone
        },
        confraria: d.confrarias // O componente DiscoveryCard pode usar isso diretamente
    })) as unknown as Discovery[];
}


export async function getConfrarias(): Promise<Confraria[]> {
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
    
    // Ajustar o nome das colunas e a contagem de descobertas
    return data.map(c => ({
        ...c,
        sealUrl: c.seal_url,
        sealHint: c.seal_hint,
        discoveryCount: c.discoveries.length
    })) as unknown as (Confraria & { discoveryCount: number })[];
}

export async function getSubmissions(): Promise<Submission[]> {
    const { data, error } = await supabase.from('submissions').select('*');
    if (error) {
        console.error('Error fetching submissions:', error);
        return [];
    }
     // Ajustar o nome das colunas
    return data.map(s => ({
        ...s,
        discoveryTitle: s.discovery_title,
    })) as Submission[];
}


// Dados estáticos para filtros, que não precisam estar no banco por enquanto
export const regions = ['Norte', 'Centro', 'Lisboa', 'Alentejo', 'Algarve', 'Açores', 'Madeira'];
export const discoveryTypes = ['Produto', 'Lugar', 'Pessoa'];
