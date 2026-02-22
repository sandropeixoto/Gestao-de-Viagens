-- Migration para tabela de configurações gerais do sistema (onde ficará o modelo da Portaria)

CREATE TABLE public.system_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    description TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- Politica de Leitura: Todos os usuários autenticados podem ler as configurações (necessário para gerar portaria)
CREATE POLICY "Enable read access for authenticated users" 
ON public.system_settings FOR SELECT 
TO authenticated USING (true);

-- Politica de Escrita: Apenas administradores (DAD) poderiam alterar. 
-- Como simplificação, checamos se o cargo do usuário é 'DAD' ou 'Admin'.
CREATE POLICY "Enable update for admins" 
ON public.system_settings FOR UPDATE 
TO authenticated USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = auth.uid() 
        AND (profiles.cargo = 'DAD' OR profiles.cargo = 'Admin')
    )
);

-- Inserir o modelo de Portaria padrão solicitado
INSERT INTO public.system_settings (key, value, description)
VALUES (
    'portaria_template', 
    'O Secretário de Estado da Fazenda, no uso de suas atribuições legais e regimentais, resolve AUTORIZAR o deslocamento do servidor [Nome], matrícula [ID], para [Destino], no período de [Data Início] a [Data Fim], com ônus para [Fonte de Recurso].',
    'Modelo de texto padrão para geração da Portaria de Viagem. Variáveis suportadas: [Nome], [ID], [Destino], [Data Início], [Data Fim], [Fonte de Recurso].'
);
