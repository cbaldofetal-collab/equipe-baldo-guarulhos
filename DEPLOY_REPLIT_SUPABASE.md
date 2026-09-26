# 🚀 Deploy uFetal - Replit + Supabase

Guia passo-a-passo para fazer deploy do backend no **Replit** com banco de dados **Supabase**.

---

## 📋 Pré-requisitos

1. **Replit Account** (grátis em replit.com)
2. **Supabase Project** ✅ Você já tem:
   - URL: `https://oshdbumabmqnerupldjs.supabase.co`
   - Public Key: `sb_publishable_JENCypkJ-HxFDzrvZKS_ug_kSI2Z...`
   - Secret Key: `sb_secret_INrfVyc0n6wYHQNl3TjZZA_uKwU1vOO`
3. **GitHub Repo** (você já tem: `cbaldofetal-collab/ufetal`)

---

## 🎯 Etapa 1: Importar Projeto no Replit

### 1.1 Acessar Replit
1. Acesse [replit.com](https://replit.com/)
2. Clique em **"Create"** (canto superior esquerdo)

### 1.2 Importar do GitHub
1. Procure por **"Import from GitHub"**
2. Cole: `https://github.com/cbaldofetal-collab/ufetal`
3. Replit vai clonar o repositório automaticamente

### 1.3 Aguardar o Setup
- Replit vai instalar dependências automaticamente
- Isso leva ~2-3 minutos

---

## 🔧 Etapa 2: Configurar Variáveis de Ambiente

### 2.1 Adicionar .env no Replit
1. No painel esquerdo, clique em **"Secrets"** (ícone de chave)
2. Clique em **"Add Secret"**
3. Adicione as 2 variáveis (uma de cada vez):

#### Secret 1: SUPABASE_URL
```
Name:  SUPABASE_URL
Value: https://oshdbumabmqnerupldjs.supabase.co
```

#### Secret 2: SUPABASE_KEY
```
Name:  SUPABASE_KEY
Value: sb_publishable_JENCypkJ-HxFDzrvZKS_ug_kSI2Z...
```

### 2.2 Adicionar NODE_ENV
```
Name:  NODE_ENV
Value: production
```

✅ **Resultado esperado:** 3 variáveis configuradas

---

## 📦 Etapa 3: Preparar o Código

### 3.1 Instalar Dependência Supabase

Na aba **"Shell"** (terminal) do Replit, execute:

```bash
npm install @supabase/supabase-js
```

### 3.2 Atualizar server.ts

1. No editor, abra o arquivo `server.ts`
2. **Substitua TODO o conteúdo** pelo código `server-supabase.ts` que foi preparado
3. Salve (Ctrl+S ou Cmd+S)

#### OU faça você manualmente:
```bash
cp server-supabase.ts server.ts
```

### 3.3 Verificar package.json

Certifique-se de que package.json tem:
```json
{
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "start": "node server.ts"
  },
  "dependencies": {
    "@supabase/supabase-js": "^2.xx.xx",
    "express": "^4.xx.xx",
    "vite": "^6.xx.xx"
  }
}
```

---

## ▶️ Etapa 4: Rodar o Backend

### 4.1 Executar no Replit

No terminal (Shell), execute:

```bash
npm start
```

**Status esperado:**
```
[uFetal] Inicializando médicos...
[uFetal] Médicos inicializados com sucesso!
[uFetal] Server running on http://0.0.0.0:3000
```

### 4.2 Obter URL Pública do Replit

Replit fornece uma URL pública automática. Procure por:
- Na janela de execução, procure por: `https://[seu-projeto].replit.dev`
- Ou copie do URL no topo da janela do navegador

**Você vai usar essa URL como `VITE_API_URL` no Vercel!**

---

## 🌐 Etapa 5: Configurar Vercel (Frontend)

### 5.1 Acessar Vercel Dashboard
1. Acesse [vercel.com/dashboard](https://vercel.com/dashboard)
2. Selecione o projeto **`ufetal`**

### 5.2 Adicionar Variável de Ambiente
1. Vá para **Settings > Environment Variables**
2. Clique em **"Add New"**
3. Configure:

```
Name:        VITE_API_URL
Value:       https://[seu-projeto-replit].replit.dev
Environment: Production, Preview, Development
```

**Exemplo:**
```
VITE_API_URL = https://ufetal-backend.replit.dev
```

### 5.3 Fazer Redeploy

1. Vá para **Deployments**
2. Clique no último deploy
3. Clique em **"Redeploy"** → **"Redeploy"**
4. Aguarde o build terminar (~2 minutos)

---

## ✅ Etapa 6: Testar a Integração

### 6.1 Acessar o Frontend
1. Abra [https://ufetal.vercel.app](https://ufetal.vercel.app) (ou seu domínio)

### 6.2 Verificar Conexão
Abra o console (F12) e procure por:
```
[uFetal] API URL: https://[seu-projeto-replit].replit.dev
```

### 6.3 Testar Funcionalidades
- ✅ Selecionar médico
- ✅ Visualizar plantões (deve carregar do Supabase)
- ✅ Criar novo plantão
- ✅ Editar plantão
- ✅ Solicitar troca
- ✅ Ver atualizações em tempo real (SSE)

---

## 🚨 Solução de Problemas

### Erro: "Cannot find module '@supabase/supabase-js'"
**Solução:**
```bash
npm install @supabase/supabase-js
```

### Erro 500 ao acessar API
**Causas:**
1. Variáveis de ambiente não configuradas (checar Secrets no Replit)
2. Banco de dados não inicializado (aguarde 10 segundos após primeiro acesso)
3. URL do Replit incorreta

**Debugar:**
- Abra o terminal do Replit e execute: `npm start`
- Verifique os logs (devem mostrar mensagens de inicialização)

### Frontend não conecta ao backend
**Solução:**
1. Verifique `VITE_API_URL` no Vercel está correto
2. Verifique no console (F12) que a URL está sendo lida
3. Faça redeploy no Vercel

### Dados não persistem entre reinicializações
- Isso é **normal** se estiver usando Replit grátis (sem Always On)
- Os dados estão salvos no **Supabase** e serão restaurados ao reabrir
- Para Always On no Replit, upgrade para plano pago

---

## 📊 Arquitetura Final

```
┌─────────────────────────────────────────────────────┐
│                    Internet                         │
└───────────────────────┬─────────────────────────────┘
                        │
        ┌───────────────┴────────────────┐
        │                                │
        ▼                                ▼
    [Browser]                     [HTTPS URLs]
        │                                │
        ├─────────────────────────────────┤
        │                                 │
        ▼                                 ▼
  https://ufetal.        https://[seu-projeto]
   vercel.app                .replit.dev
        │                                 │
        ├─[React Frontend]────────────────├─[Express API]
        │   • Vite Build                  │ • Port 3000
        │   • Static Files                │ • SSE Streaming
        │   • Tailwind CSS                │ • Supabase Client
        │                                 │
        │◄──────[SSE Events]──────────────┤
        │                                 │
        └────[API Calls REST]─────────────┘
                                          │
                                          ▼
                                    [Supabase]
                                     PostgreSQL
                                     • doctors
                                     • shifts
                                     • trades
                                     • audit_logs
```

---

## ✅ Checklist Final

- [ ] Variáveis de ambiente configuradas no Replit
- [ ] `@supabase/supabase-js` instalado
- [ ] `server.ts` atualizado para Supabase
- [ ] Backend rodando no Replit
- [ ] URL do Replit copiada
- [ ] `VITE_API_URL` configurado no Vercel
- [ ] Vercel redeployed
- [ ] Frontend carregando dados do Supabase
- [ ] SSE/Tempo Real funcionando
- [ ] Médicos aparecem na tela
- [ ] Plantões carregam

---

## 📞 Próximos Passos

1. **Compartilhar com a equipe:**
   - Enviar link do Vercel para os médicos
   - Eles podem começar a usar

2. **Monitorar:**
   - Checar logs do Replit periodicamente
   - Monitorar uso do Supabase (gratuito tem limite)

3. **Melhorias futuras:**
   - Usar domínio customizado
   - Adicionar autenticação
   - Configurar backups automáticos

---

**Status:** ✅ Sistema pronto para uso com dados persistentes! 🎉
