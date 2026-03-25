-- Migration: SSO Support and Default Settings
-- 1. Add SSO columns to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS gestorgov_id TEXT,
ADD COLUMN IF NOT EXISTS nivel_acesso INTEGER;

-- 2. Ensure Nome exists (was already in AuthContext interface but maybe not in schema)
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='nome') THEN
        ALTER TABLE public.profiles ADD COLUMN nome TEXT;
    END IF;
END $$;

-- 3. Add default portaria template if not exists
INSERT INTO public.system_settings (key, value, description)
VALUES (
    'portaria_template', 
    'O Secretário de Estado da Fazenda, no uso de suas atribuições legais que lhe são conferidas, resolve AUTORIZAR o deslocamento do servidor [Nome], matrícula [ID], para a cidade de [Destino], no período de [Data Início] a [Data Fim], com ônus total/parcial para a fonte de recurso [Fonte de Recurso], para fins de interesse institucional.',
    'Template base para geração de Portarias de Viagem em PDF'
)
ON CONFLICT (key) DO NOTHING;
