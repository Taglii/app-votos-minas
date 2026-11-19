# 🗳️ Voto Minas — Eleições de Minas Gerais

Aplicativo móvel desenvolvido em **React Native, Expo SDK 58, Expo Router e TypeScript**, com foco nas eleições gerais de Minas Gerais e na disputa presidencial.

O Voto Minas é uma plataforma cívica desenvolvida para facilitar o acesso às informações eleitorais, permitindo que os cidadãos consultem candidatos, organizem sua própria cola eleitoral e pratiquem seus votos por meio de um simulador inspirado na urna eletrônica brasileira.

---

## 📱 Funcionalidades

### 1. Dashboard Interativo — Início
- Resumo das eleições em Minas Gerais.
- Identidade visual inspirada no lema do estado: *Libertas Quæ Sera Tamen*.
- Estatísticas de apuração e votos registrados na simulação.
- Distribuição de candidatos por cargo:
  - Presidente;
  - Governador;
  - Senador;
  - Deputado Federal;
  - Deputado Estadual.
- Distribuição por espectro político:
  - Esquerda;
  - Centro-Esquerda;
  - Centro;
  - Centro-Direita;
  - Direita.
- Atalhos rápidos para as principais funcionalidades.

### 2. Consulta e Filtro de Candidatos
- Integração com a API pública Eleições.dev.
- Consulta de dados eleitorais provenientes do TSE.
- Cache em memória para otimização das requisições.
- Tratamento de erros e estados de carregamento.
- Busca em tempo real por nome, número ou partido.
- Filtros dinâmicos por cargo e espectro político.

### 3. Perfil Detalhado do Candidato
Cada candidato possui uma página individual com:
- Foto oficial;
- Nome de urna;
- Número eleitoral;
- Cargo disputado;
- Partido;
- Naturalidade;
- Ocupação;
- Escolaridade;
- Biografia baseada nos dados disponíveis do TSE;
- Situação eleitoral e informações complementares.

Também é possível:
- Adicionar ou remover candidatos da Minha Cola;
- Salvar candidatos para acesso offline;
- Abrir diretamente o simulador de urna com o candidato selecionado.

### 4. Simulador de Urna Eletrônica
Simulador interativo inspirado na urna eletrônica utilizada pelo TSE/TRE-MG.

**Recursos disponíveis:**
- Visor digital interativo;
- Busca automática de candidatos conforme a digitação;
- Exibição da foto, nome, número e partido;
- Simulação de voto válido;
- Simulação de voto nulo;
- Simulação de voto em branco;
- Teclas BRANCO, CORRIGE e CONFIRMA;
- Tela de encerramento com mensagem FIM;
- Efeito sonoro simulado de confirmação (PILILILI).

**Quantidade de dígitos por cargo:**

| Cargo | Dígitos |
|---|---:|
| Presidente | 2 |
| Governador | 2 |
| Senador | 3 |
| Deputado Federal | 4 |
| Deputado Estadual | 5 |

Os votos simulados são armazenados localmente e totalizados no dispositivo, com opção de zerésima para reiniciar os registros.

### 5. Minha Cola Eleitoral — Offline
Permite que o eleitor organize os candidatos que deseja consultar durante sua preparação para a votação.

- Armazenamento local via AsyncStorage;
- Acesso offline aos candidatos salvos;
- Remoção individual de candidatos;
- Limpeza completa da lista;
- Filtro por cargo;
- Atalho para treinar o voto diretamente no simulador.

---

## 🛠️ Tecnologias Utilizadas

| Tecnologia | Versão | Finalidade |
|---|---|---|
| React Native | 0.88.1 | Desenvolvimento mobile |
| React | 19 | Construção da interface |
| Expo | SDK 58 | Plataforma de desenvolvimento |
| Expo Router | 58 | Navegação baseada em arquivos |
| TypeScript | 6 | Tipagem estática |
| AsyncStorage | 2.2.0 | Armazenamento local |
| Expo Vector Icons | 15 | Ícones da aplicação |
| Safe Area Context | 5.11 | Gerenciamento de áreas seguras |

### APIs e serviços externos

**Eleições.dev**

API utilizada para consultar informações eleitorais e dados de candidatos provenientes das bases do TSE.

Documentação e acesso: https://api.eleicoes.dev

**wsrv.nl**

Proxy de imagens utilizado para permitir a renderização de fotografias hospedadas nos servidores do TSE, contornando restrições relacionadas ao cabeçalho `Content-Disposition: attachment`.

---

## 📂 Estrutura do Projeto

```text
voto-minas/
│
├── .env
│
├── src/
│   ├── app/
│   │   ├── _layout.tsx
│   │   │
│   │   ├── (tabs)/
│   │   │   ├── _layout.tsx
│   │   │   ├── index.tsx
│   │   │   ├── candidatos.tsx
│   │   │   ├── urna.tsx
│   │   │   └── favoritos.tsx
│   │   │
│   │   └── candidato/
│   │       └── [id].tsx
│   │
│   ├── components/
│   │   ├── Badge.tsx
│   │   ├── CandidateCard.tsx
│   │   └── UrnaTeclado.tsx
│   │
│   ├── services/
│   │   ├── api.ts
│   │   └── storage.ts
│   │
│   └── types/
│       └── candidato.ts
│
├── package.json
└── README.md
```

---

## 🚀 Como Executar o Projeto

### 1. Pré-requisitos

Antes de começar, certifique-se de possuir:

- Node.js instalado;
- npm instalado;
- Git (opcional);
- Expo CLI via `npx`.

### 2. Instalar as dependências

Clone o repositório e acesse a pasta do projeto:

```bash
git https://github.com/Taglii/app-votos-minas.git
cd voto-minas
```

Instale as dependências:

```bash
npm install
```

### 3. Configurar a API

Crie um arquivo `.env` na raiz do projeto:

```env
EXPO_PUBLIC_API_URL=https://api.eleicoes.dev
EXPO_PUBLIC_API_KEY=sua_api_key_aqui
```

Obtenha sua chave de API gratuita através do site:

https://eleicoes.dev

**Importante:** não compartilhe sua chave de API publicamente.

### 4. Iniciar o servidor

Execute:

```bash
npx expo start
```

### 5. Escolher a plataforma

Após iniciar o servidor, utilize os atalhos disponíveis:

| Tecla | Plataforma |
|---|---|
| `a` | Emulador Android |
| `i` | Simulador iOS |
| `w` | Navegador Web |
| QR Code | Dispositivo físico com Expo Go |

---

## 🧪 Validação e Qualidade do Código

O projeto utiliza TypeScript e ESLint para garantir maior confiabilidade e qualidade do código.

**Verificar erros de TypeScript:**

```bash
npx tsc --noEmit
```

**Executar o ESLint:**

```bash
npx expo lint
```

O objetivo é manter o projeto sem erros de tipagem e sem avisos ou erros de linting.

---

## 💾 Armazenamento Offline

O aplicativo utiliza `@react-native-async-storage/async-storage` para persistir informações localmente.

Os dados armazenados incluem:

- Candidatos selecionados na Minha Cola;
- Histórico e totalização dos votos simulados;
- Informações necessárias para funcionalidades offline.

Isso permite que determinadas funcionalidades continuem disponíveis mesmo sem conexão com a internet.

---

## 🎯 Objetivo do Projeto

O Voto Minas tem como objetivo aproximar os cidadãos do processo eleitoral, oferecendo uma ferramenta acessível para consulta de informações, organização de candidatos e familiarização com o funcionamento da urna eletrônica.

A proposta é contribuir para uma participação eleitoral mais consciente e informada.

---

## ⚠️ AVISO IMPORTANTE

O Voto Minas é um projeto independente, desenvolvido com finalidade informativa e educacional.

O simulador não realiza votos oficiais, não possui vínculo institucional com o TSE ou TRE-MG e não substitui os canais oficiais de consulta eleitoral.

As informações dos candidatos dependem da disponibilidade e atualização das fontes de dados utilizadas.

---

**Desenvolvido com React Native, Expo e TypeScript.**

**Desenvolvido por Matheus Henrique Tagliatti**

*Voto Minas — Informação para uma escolha consciente.*