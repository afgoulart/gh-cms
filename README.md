# GitHub CMS

Um sistema de gerenciamento de conteúdo (CMS) desenvolvido em Next.js que permite gerenciar arquivos diretamente de um repositório GitHub.

## Funcionalidades

- 📁 **Navegação de Arquivos**: Explore a estrutura de pastas do seu repositório
- 📝 **Editor de Arquivos**: Crie e edite arquivos diretamente na interface
- 🌿 **Sistema de Branches**: Novos conteúdos são criados em branches separadas
- 📋 **Pull Requests Automáticos**: Gerenciamento automático de PRs para publicação
- 🚀 **Publicação Controlada**: Publique conteúdo fazendo merge para a main
- 💾 **Salvamento Automático**: Commits automáticos para o GitHub
- 🗑️ **Exclusão de Arquivos**: Remova arquivos com segurança
- 🔄 **Sincronização em Tempo Real**: Conecta diretamente com a API do GitHub
- 📊 **Status de Publicação**: Visualize se o conteúdo está publicado ou em rascunho

## Configuração

### 1. Pré-requisitos

- Node.js 18+
- Conta GitHub
- Personal Access Token do GitHub

### 2. Instalação

```bash
npm install
```

### 3. Configuração do Ambiente

Crie um arquivo `.env.local` na raiz do projeto com as seguintes variáveis:

```env
GITHUB_TOKEN=seu_token_de_acesso_pessoal_github
GITHUB_OWNER=seu_usuario_github
GITHUB_REPO=nome_do_repositorio_de_conteudo
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=sua_chave_secreta_nextauth
```

### 4. Como obter o GitHub Personal Access Token

1. Acesse GitHub → Settings → Developer settings → Personal access tokens
2. Clique em "Generate new token (classic)"
3. Selecione os seguintes escopos:
   - `repo` (acesso total aos repositórios)
   - `user:email` (acesso ao email do usuário)
4. Copie o token gerado

### 5. Execução

```bash
npm run dev
```

Acesse http://localhost:3000 para usar o CMS.

## Como Usar

### Fluxo de Trabalho com Branches

1. **Navegar**: Use o painel esquerdo para navegar pelas pastas do repositório
2. **Seletor de Branch**: Escolha entre visualizar conteúdo publicado (main) ou rascunhos
3. **Criar**: Clique em "Novo Arquivo" para criar um novo arquivo
   - ✨ **Novos arquivos são automaticamente criados em uma branch separada**
   - 📋 **Um Pull Request é criado automaticamente para publicação**
4. **Editar**: Clique em qualquer arquivo para editá-lo
5. **Salvar**: Use o botão "Salvar" e adicione uma mensagem de commit
6. **Publicar**: No painel "Aguardando Publicação", clique em "Publicar" para fazer merge do conteúdo
7. **Excluir**: Use o botão "Excluir" para remover arquivos

### Status dos Arquivos

- 🌐 **Publicado**: Arquivo está na branch main e visível publicamente
- 📝 **Rascunho**: Arquivo está em branch separada aguardando publicação
- 🔄 **Aguardando Publicação**: Pull Request criado e pronto para merge

## Estrutura do Projeto

```
gh-cms/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── branches/
│   │   │   ├── contents/
│   │   │   ├── files/
│   │   │   └── pull-requests/
│   │   └── page.tsx
│   ├── components/
│   │   ├── FileList.tsx
│   │   ├── FileEditor.tsx
│   │   └── PublishManager.tsx
│   └── lib/
│       └── github.ts
├── .env.local
└── package.json
```

## Tecnologias Utilizadas

- **Next.js 15**: Framework React
- **TypeScript**: Tipagem estática
- **Tailwind CSS**: Estilização
- **Octokit**: Cliente oficial da API GitHub
- **React**: Interface do usuário

## Recursos da API

### `/api/contents`
- `GET`: Lista arquivos e pastas em um diretório (suporta parâmetro `branch`)

### `/api/files`
- `GET`: Obtém conteúdo de um arquivo específico (suporta parâmetro `branch`)
- `POST`: Cria ou atualiza um arquivo (cria branch automaticamente para novos arquivos)
- `DELETE`: Remove um arquivo

### `/api/branches`
- `GET`: Lista todas as branches do repositório
- `POST`: Cria uma nova branch
- `DELETE`: Remove uma branch

### `/api/pull-requests`
- `GET`: Lista pull requests abertos
- `POST`: Cria um novo pull request

### `/api/pull-requests/[id]/merge`
- `POST`: Faz merge de um pull request específico

## Segurança e Controle

- 🔒 **Token do GitHub**: Mantido no servidor (não exposto ao cliente)
- ✅ **Validação**: Todas as operações passam por validação no backend
- 📝 **Commits Descritivos**: Mensagens personalizadas para cada alteração
- 🌿 **Isolamento**: Novos conteúdos são isolados em branches até publicação
- 🔍 **Revisão**: Pull requests permitem revisão antes da publicação
- 🧹 **Limpeza Automática**: Branches são removidas após merge

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
