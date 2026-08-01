-- Script SQL para criar ou ajustar a tabela 'faces' no Supabase

-- Habilita extensão para UUID se necessário
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Cria a tabela 'faces' caso ainda não exista
CREATE TABLE IF NOT EXISTS public.faces (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome VARCHAR(255) NOT NULL,
    face_embedding JSONB NOT NULL, -- Vetor de 128 números (float array) armazenado em JSONB
    foto_url TEXT,                 -- URL da imagem ou String Base64 da foto
    criado_em TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Habilita Row Level Security (RLS) se desejado ou permissões públicas para desenvolvimento
ALTER TABLE public.faces ENABLE ROW LEVEL SECURITY;

-- Política simples para permitir leitura e inserção via API Anon / Service Role
CREATE POLICY "Permitir leitura pública em faces" ON public.faces FOR SELECT USING (true);
CREATE POLICY "Permitir inserção pública em faces" ON public.faces FOR INSERT WITH CHECK (true);
