-- Migration: 20260406000002_transport_types.sql
-- Goal: Managed transport types for travel requests

CREATE TABLE public.transport_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.transport_types ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Everyone can view active transport types" ON public.transport_types
    FOR SELECT USING (active = true);

CREATE POLICY "Only DAD can manage transport types" ON public.transport_types
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles AS p
            WHERE p.id = auth.uid()
            AND p.cargo = 'DAD'
        )
    );

-- Initial seed
INSERT INTO public.transport_types (name) VALUES 
('Aéreo'), ('Terrestre (Ônibus)'), ('Veículo Oficial'), ('Fluvial')
ON CONFLICT (name) DO NOTHING;
