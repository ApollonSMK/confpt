-- Apagar views, tabelas e tipos existentes para garantir um recomeço limpo (idempotência).
-- A ordem é importante para respeitar as dependências.
DROP VIEW IF EXISTS discovery_seal_counts;
DROP TABLE IF EXISTS seals;
DROP TABLE IF EXISTS submissions;
DROP TABLE IF EXISTS discoveries;
DROP TABLE IF EXISTS confrarias;
DROP TYPE IF EXISTS region_type;
DROP TYPE IF EXISTS discovery_type;
DROP TYPE IF EXISTS submission_status;


--
-- Tipos Enumerados (Enums)
--

-- Cria o tipo para as regiões de Portugal.
CREATE TYPE region_type AS ENUM (
    'Norte', 
    'Centro', 
    'Lisboa', 
    'Alentejo', 
    'Algarve', 
    'Açores', 
    'Madeira'
);

-- Cria o tipo para as categorias de descobertas.
CREATE TYPE discovery_type AS ENUM (
    'Produto', 
    'Lugar', 
    'Pessoa'
);

-- Cria o tipo para os estados de uma submissão.
CREATE TYPE submission_status AS ENUM (
    'Pendente', 
    'Aprovado', 
    'Rejeitado'
);


--
-- Tabelas
--

-- Tabela para as Confrarias
CREATE TABLE confrarias (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    motto TEXT,
    region region_type NOT NULL,
    seal_url TEXT,
    seal_hint TEXT
);
ALTER TABLE confrarias ENABLE ROW LEVEL SECURITY;

-- Tabela para as Descobertas
CREATE TABLE discoveries (
    id SERIAL PRIMARY KEY,
    slug TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    description TEXT,
    editorial TEXT,
    region region_type NOT NULL,
    type discovery_type NOT NULL,
    image_url TEXT,
    image_hint TEXT,
    address TEXT,
    website TEXT,
    phone TEXT,
    confraria_id INTEGER REFERENCES confrarias(id)
);
ALTER TABLE discoveries ENABLE ROW LEVEL SECURITY;

-- Tabela para as Submissões dos utilizadores
CREATE TABLE submissions (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    date DATE NOT NULL,
    status submission_status NOT NULL DEFAULT 'Pendente',
    discovery_title TEXT NOT NULL,
    editorial TEXT,
    region region_type,
    type discovery_type,
    links TEXT,
    confraria_id INTEGER REFERENCES confrarias(id)
);
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;

-- Tabela para os Selos (associação Utilizador-Descoberta)
CREATE TABLE seals (
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    discovery_id INTEGER REFERENCES discoveries(id) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (user_id, discovery_id)
);
ALTER TABLE seals ENABLE ROW LEVEL SECURITY;


--
-- Views
--

-- View para contar o número de selos por descoberta de forma eficiente.
CREATE OR REPLACE VIEW discovery_seal_counts AS
SELECT
    discovery_id,
    count(*) AS seal_count
FROM
    seals
GROUP BY
    discovery_id;


--
-- Políticas de Segurança (Row Level Security - RLS)
--

-- Confrarias: Permite leitura pública para todos.
CREATE POLICY "Public can read confrarias"
ON confrarias FOR SELECT
USING (true);

-- Discoveries: Permite leitura pública para todos.
CREATE POLICY "Public can read discoveries"
ON discoveries FOR SELECT
USING (true);

-- Submissions:
-- Permite que um utilizador autenticado crie uma submissão para si mesmo.
CREATE POLICY "Authenticated users can create submissions"
ON submissions FOR INSERT
WITH CHECK (auth.role() = 'authenticated');
-- Permite que um utilizador veja apenas as suas próprias submissões.
CREATE POLICY "Users can view their own submissions"
ON submissions FOR SELECT
USING (auth.uid() = user_id);

-- Seals:
-- Permite que um utilizador autenticado crie um selo.
CREATE POLICY "Authenticated users can create seals"
ON seals FOR INSERT
WITH CHECK (auth.role() = 'authenticated');
-- Permite que um utilizador veja apenas os seus próprios selos.
CREATE POLICY "Users can view their own seals"
ON seals FOR SELECT
USING (auth.uid() = user_id);
-- Permite que um utilizador apague os seus próprios selos.
CREATE POLICY "Users can delete their own seals"
ON seals FOR DELETE
USING (auth.uid() = user_id);
