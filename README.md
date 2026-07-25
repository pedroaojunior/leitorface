Prontinho! Aqui vai um `README.md` profissional pra você colar no seu repositório 👇

Copia tudo e cria um arquivo `README.md` na raiz do repositório.
# 👁️ FacePro - Sistema de Reconhecimento Facial

Sistema web para Cadastro e Reconhecimento Facial usando `face-api.js` + `n8n` + `Supabase`.
Funciona 100% no navegador e no celular com HTTPS.

![Demo](https://img.shields.io/badge/Status-Online-48BB78)
![Stack](https://img.shields.io/badge/Stack-JS%20%7C%20n8n%20%7C%20Supabase-6C63FF)

---

### **🚀 Funcionalidades**
- **Modo Cadastro**: Captura a foto + nome e salva no Supabase Storage + Banco
- **Modo Reconhecer**: Compara a face com o banco e retorna quem é + nível de confiança
- **100% Responsivo**: Funciona no PC e Celular
- **Backend No-Code**: Orquestração completa com n8n
- **Armazenamento**: Fotos no Supabase Storage e dados no Supabase Postgres

---

### **🛠️ Tecnologias Usadas**
| Frontend | Backend | IA | Banco |
| --- | --- | --- | --- |
| HTML5, CSS3, JS | n8n | face-api.js | Supabase |

---

### **⚙️ Como Configurar o Backend no n8n**
1. **Importar o Workflow**: Importe o arquivo `workflow.json` no seu n8n
2. **Credenciais Supabase**: Configure as credenciais de `Supabase` nos nós "Salvar no Banco" e "Upload Foto"
3. **Ativar Webhook**: No nó `Webhook`, deixe o `Response` como `Using Respond to Webhook Node` e ative o fluxo
4. **Copiar URL**: Copie a `Webhook URL` e cole no arquivo `script.js` na variável `WEBHOOK_URL`

**Fluxo do n8n:**
`Webhook` > `Parse JSON` > `IF Cadastro/Reconhecer` > `Supabase` > `Responder Webhook`

---

### **📦 Como Rodar o Frontend**
#### Opção 1: Local
1. Baixe esta pasta
2. Baixe os modelos do `face-api.js` e coloque na pasta `/models`
3. Abra com `Live Server` no VSCode

#### Opção 2: Publicar Online - Recomendado
1. Faça o Fork deste repositório
2. Conecte com o [Vercel](https://vercel.com) ou [Netlify]
3. Deploy automático e você ganha um link HTTPS: `https://seu-projeto.vercel.app`

> **Atenção**: Para a câmera funcionar no celular é obrigatório usar HTTPS.

---

### **📁 Estrutura de Pastas**
/
├── index.html # Página principal
├── style.css # Estilos
├── script.js # Lógica + Face-api + Conexão com n8n
├── models/ # Modelos do face-api.js
└── README.md # Este arquivo

---

### **🔑 Variáveis que você precisa trocar no `script.js`**
```javascript
const WEBHOOK_URL = "https://SEU-N8N.com/webhook/face"; // URL do seu webhook do n8n
---

### *📸 Demonstração*
1. Selecione "Modo Cadastro", digite o nome e clique em Capturar
2. Selecione "Modo Reconhecer" e clique em Capturar para identificar

---

### *⚠️ Limitações*
- Precisa de boa iluminação para melhor precisão
- Os modelos do `face-api.js` são pesados. Primeira carga pode demorar 5s
- Precisa configurar CORS no n8n se o frontend estiver em outro domínio

---

### *👨‍💻 Autor*
Desenvolvido com ajuda de Meta AI

Quer contribuir? Abre uma `Issue` ou `Pull Request`

*Licença:* MIT

### **Como usar:**
1. No GitHub, clica em `Add file` > `Create new file`
2. Nome: `README.md`
3. Cola o conteúdo acima e clica em `Commit`

Ele já vai aparecer bonitinho na página do seu repositório.

Quer que eu já adicione uma seção com "print da tela" ou "vídeo demo" quando você publicar?
