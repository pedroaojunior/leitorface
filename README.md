# 🚀 Sistema de Biometria Facial (n8n + Supabase + HTML/CSS/JS)

Este projeto implementa um sistema completo de **Cadastro e Reconhecimento Facial** em tempo real via Webcam ou câmera de celular.

---

## 🛠️ Tecnologias Utilizadas

1. **Frontend**: HTML5, CSS3 (Dark Glassmorphism), JavaScript ES6+.
2. **AI & Biometria**: `@vladmandic/face-api` (Gera vetores numéricos `face_embedding` de 128 dimensões).
3. **Automação Backend**: **n8n** (Fluxo de Webhook + Validação e Comparação Facial).
4. **Banco de Dados**: **Supabase** (Tabela `faces` armazenando embeddings em JSONB).

---

## 📁 Estrutura de Arquivos

```
facial_recognition_app/
├── index.html            # Interface Web da Câmera e Abas de Cadastro / Busca
├── style.css             # Estilização Futurista Dark Glassmorphism
├── app.js                # Lógica da Câmera, Face API e Requisições Webhook
├── n8n_workflow.json     # Fluxo completo exportado pronto para importar no n8n
├── supabase_setup.sql    # Script SQL para criar a tabela 'faces' no Supabase
└── README.md             # Guia de Configuração e Uso
```

---

## ⚙️ Passo 1: Configurar a Tabela no Supabase

1. Acesse o **Supabase Console** do seu projeto.
2. Abra o **SQL Editor**.
3. Copie e execute o conteúdo do arquivo [`supabase_setup.sql`](file:///C:/Users/PJR/.gemini/antigravity/scratch/facial_recognition_app/supabase_setup.sql):

```sql
CREATE TABLE IF NOT EXISTS public.faces (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome VARCHAR(255) NOT NULL,
    face_embedding JSONB NOT NULL,
    foto_url TEXT,
    criado_em TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
```

---

## ⚙️ Passo 2: Importar o Fluxo no n8n

1. Abra o seu **n8n**.
2. Clique em **Workflows** -> **Import from File**.
3. Selecione o arquivo [`n8n_workflow.json`](file:///C:/Users/PJR/.gemini/antigravity/scratch/facial_recognition_app/n8n_workflow.json).
4. Nos nós do **Supabase** (`Cadastro rosto` e `Pegar Todos`), selecione a sua credencial do Supabase.
5. Clique em **Save** e ative o fluxo (**Active: ON**).
6. Copie a URL do **Webhook** do nó inicial (ex: `http://localhost:5678/webhook/face-biometrics` ou sua URL de produção).

---

## ⚙️ Passo 3: Executar a Aplicação Web

Para testar a câmera e a IA localmente:
- Você pode abrir diretamente o arquivo [`index.html`](file:///C:/Users/PJR/.gemini/antigravity/scratch/facial_recognition_app/index.html) no navegador ou subir um servidor estático rápido:

```bash
# Opção com Python
python -m http.server 8080

# Ou com Node npx
npx serve .
```

- Na aplicação Web, clique no ícone de **Engrenagem ⚙️** no canto superior direito e cole a URL do Webhook do n8n.

---

## 🔍 Como Funciona o Reconhecimento Facial

1. O navegador carrega os modelos neurais do `face-api.js` via CDN.
2. A câmera rastreia o rosto e extrai uma matriz de 128 números (`face_embedding`), que representa as distâncias únicas dos traços do seu rosto.
3. No **Cadastro**: Envia o nome, foto e o vetor para o n8n -> Supabase.
4. Na **Pesquisa**: O n8n busca todos os registros e roda um algoritmo de **Distância Euclidiana** em JavaScript. Se a distância for menor que `0.55`, considera o mesmo rosto e exibe o nome correspondente com a porcentagem de similaridade!
