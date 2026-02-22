-- Migration: SGPD Schema and RLS Policies

-- 1. Profiles Table (extends auth.users)
CREATE TABLE public.profiles (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    cargo TEXT NOT NULL,
    departamento TEXT NOT NULL,
    banco TEXT,
    agencia TEXT,
    conta TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
CREATE POLICY "Users can view their own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Aprovadores can view profiles in their department" ON public.profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles AS p
            WHERE p.id = auth.uid()
            AND p.departamento = profiles.departamento
            AND p.cargo IN ('Chefia', 'Subsecretário', 'Secretário', 'DAD')
        )
    );
    
CREATE POLICY "DAD and Auditoria can view all profiles" ON public.profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles AS p
            WHERE p.id = auth.uid()
            AND p.cargo IN ('DAD', 'Auditoria')
        )
    );

-- 2. Diem Rates (Tabela parametrizável de diárias)
CREATE TABLE public.diem_rates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    destino TEXT NOT NULL,
    cargo TEXT NOT NULL,
    valor DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(destino, cargo)
);

-- Enable RLS for diem_rates
ALTER TABLE public.diem_rates ENABLE ROW LEVEL SECURITY;

-- Diem Rates Policies
CREATE POLICY "Everyone can view diem rates" ON public.diem_rates
    FOR SELECT USING (true);

CREATE POLICY "Only DAD can manage diem rates" ON public.diem_rates
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles AS p
            WHERE p.id = auth.uid()
            AND p.cargo = 'DAD'
        )
    );

-- 3. Travel Requests
CREATE TYPE public.travel_status AS ENUM (
    'Rascunho',
    'Aguardando Chefia',
    'Aguardando Subsecretario',
    'Aguardando DAD',
    'Aguardando Financeiro',
    'Aprovado',
    'Aguardando Prestacao de Contas',
    'Em Prestacao',
    'Em Atraso',
    'Concluido',
    'Rejeitado'
);

CREATE TYPE public.fundo_recurso AS ENUM ('FIPAT', 'Tesouro', 'BID');

CREATE TABLE public.travel_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) NOT NULL,
    destino TEXT NOT NULL,
    data_ida DATE NOT NULL,
    data_retorno DATE NOT NULL,
    justificativa TEXT NOT NULL,
    fonte_recurso public.fundo_recurso NOT NULL,
    status public.travel_status DEFAULT 'Rascunho'::public.travel_status NOT NULL,
    valor_previsto DECIMAL(10, 2) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for travel_requests
ALTER TABLE public.travel_requests ENABLE ROW LEVEL SECURITY;

-- Travel Requests Policies
CREATE POLICY "Users can view their own travel requests" ON public.travel_requests
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own travel requests" ON public.travel_requests
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own travel requests in draft" ON public.travel_requests
    FOR UPDATE USING (auth.uid() = user_id AND status = 'Rascunho');

CREATE POLICY "Aprovadores can view travel requests in their department" ON public.travel_requests
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles AS p_viewer
            JOIN public.profiles AS p_owner ON p_owner.id = travel_requests.user_id
            WHERE p_viewer.id = auth.uid()
            AND p_viewer.departamento = p_owner.departamento
            AND p_viewer.cargo IN ('Chefia', 'Subsecretário', 'Secretário', 'DAD')
        )
    );

CREATE POLICY "Aprovadores can update travel requests in their department" ON public.travel_requests
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.profiles AS p_viewer
            JOIN public.profiles AS p_owner ON p_owner.id = travel_requests.user_id
            WHERE p_viewer.id = auth.uid()
            AND p_viewer.departamento = p_owner.departamento
            AND p_viewer.cargo IN ('Chefia', 'Subsecretário', 'Secretário', 'DAD')
        )
    );

CREATE POLICY "DAD and Auditoria can view all travel requests" ON public.travel_requests
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles AS p
            WHERE p.id = auth.uid()
            AND p.cargo IN ('DAD', 'Auditoria')
        )
    );

-- 4. Approval Workflow (Log)
CREATE TABLE public.approval_workflow (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    travel_id UUID REFERENCES public.travel_requests(id) ON DELETE CASCADE NOT NULL,
    aprovador_id UUID REFERENCES public.profiles(id) NOT NULL,
    papel_aprovador TEXT NOT NULL,
    acao TEXT NOT NULL, -- 'Aprovado', 'Rejeitado', 'Devolvido'
    comentarios TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for approval_workflow
ALTER TABLE public.approval_workflow ENABLE ROW LEVEL SECURITY;

-- Approval Workflow Policies
CREATE POLICY "Users can view workflow for their own requests" ON public.approval_workflow
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.travel_requests AS tr
            WHERE tr.id = approval_workflow.travel_id
            AND tr.user_id = auth.uid()
        )
    );

CREATE POLICY "Aprovadores can view workflow for their department" ON public.approval_workflow
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.travel_requests AS tr
            JOIN public.profiles AS p_owner ON p_owner.id = tr.user_id
            JOIN public.profiles AS p_viewer ON p_viewer.id = auth.uid()
            WHERE tr.id = approval_workflow.travel_id
            AND p_viewer.departamento = p_owner.departamento
            AND p_viewer.cargo IN ('Chefia', 'Subsecretário', 'Secretário', 'DAD')
        )
    );

CREATE POLICY "Aprovadores can insert workflow" ON public.approval_workflow
    FOR INSERT WITH CHECK (
        auth.uid() = aprovador_id
        AND EXISTS (
             SELECT 1 FROM public.profiles AS p
             WHERE p.id = auth.uid()
             AND p.cargo IN ('Chefia', 'Subsecretário', 'Secretário', 'DAD')
        )
    );

CREATE POLICY "DAD and Auditoria can view all workflows" ON public.approval_workflow
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles AS p
            WHERE p.id = auth.uid()
            AND p.cargo IN ('DAD', 'Auditoria')
        )
    );

-- 5. Travel Documents
CREATE TYPE public.document_type AS ENUM ('comprovante', 'bilhete', 'relatorio', 'prestacao_contas');

CREATE TABLE public.travel_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    travel_id UUID REFERENCES public.travel_requests(id) ON DELETE CASCADE NOT NULL,
    uploaded_by UUID REFERENCES public.profiles(id) NOT NULL,
    tipo public.document_type NOT NULL,
    storage_path TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for travel_documents
ALTER TABLE public.travel_documents ENABLE ROW LEVEL SECURITY;

-- Travel Documents Policies
CREATE POLICY "Users can view documents for their own requests" ON public.travel_documents
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.travel_requests AS tr
            WHERE tr.id = travel_documents.travel_id
            AND tr.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can upload documents for their own requests" ON public.travel_documents
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.travel_requests AS tr
            WHERE tr.id = travel_documents.travel_id
            AND tr.user_id = auth.uid()
        )
        AND auth.uid() = uploaded_by
    );

CREATE POLICY "Aprovadores can view documents for their department" ON public.travel_documents
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.travel_requests AS tr
            JOIN public.profiles AS p_owner ON p_owner.id = tr.user_id
            JOIN public.profiles AS p_viewer ON p_viewer.id = auth.uid()
            WHERE tr.id = travel_documents.travel_id
            AND p_viewer.departamento = p_owner.departamento
            AND p_viewer.cargo IN ('Chefia', 'Subsecretário', 'Secretário', 'DAD')
        )
    );

CREATE POLICY "DAD and Auditoria can view all documents" ON public.travel_documents
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles AS p
            WHERE p.id = auth.uid()
            AND p.cargo IN ('DAD', 'Auditoria')
        )
    );

-- 6. Notifications/Logs
CREATE TABLE public.notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) NOT NULL,
    mensagem TEXT NOT NULL,
    lida BOOLEAN DEFAULT false NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view their own notifications" ON public.notifications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can insert notifications" ON public.notifications
    FOR INSERT WITH CHECK (true); -- Assuming inserted via database functions (postgres role)

-- Trigger to calculate estimated diem rate value on request insert/update
CREATE OR REPLACE FUNCTION calculate_diem_value()
RETURNS TRIGGER AS $$
DECLARE
    diem_rate DECIMAL;
    days INT;
BEGIN
    -- Obter o valor da diária para o destino e cargo do servidor
    SELECT valor INTO diem_rate
    FROM public.diem_rates
    WHERE destino = NEW.destino
    AND cargo = (SELECT cargo FROM public.profiles WHERE id = NEW.user_id);
    
    IF diem_rate IS NOT NULL THEN
        -- Calcular dias (incluindo o dia de ida e volta)
        days := NEW.data_retorno - NEW.data_ida + 1;
        NEW.valor_previsto := diem_rate * days;
    ELSE
        NEW.valor_previsto := 0;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_calculate_diem_value
BEFORE INSERT OR UPDATE OF destino, data_ida, data_retorno ON public.travel_requests
FOR EACH ROW EXECUTE FUNCTION calculate_diem_value();
