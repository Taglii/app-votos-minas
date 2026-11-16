# 🔺 Voto Minas - Eleições de Minas Gerais

Aplicativo móvel desenvolvido em **React Native**, **Expo (SDK 58)**, **Expo Router (File-Based Routing)** e **TypeScript**, focado nas eleições gerais de Minas Gerais.

---

## 📱 Visão Geral e Funcionalidades

O **Voto Minas** é uma plataforma cívica completa projetada para informar os cidadãos sobre os candidatos aos principais cargos eletivos de Minas Gerais, permitir a organização de uma "cola eleitoral" offline e disponibilizar um simulador fidedigno da urna eletrônica brasileira.

### Principais Recursos
1. **Dashboard Interativo (Início):**
   - Resumo completo das eleições em Minas Gerais (*"Libertas Quæ Sera Tamen"*).
   - Estatísticas de apuração simulada e total de votos registrados na urna.
   - Contagem e distribuição por cargo (Governador, Senador e Deputado Federal) e por lado político (Esquerda, Centro e Direita).
   - Atalhos rápidos e pré-filtros diretos para as demais abas.

2. **Consulta e Filtro de Candidatos:**
   - Lista consumida de serviço assíncrono com delay simulado (`Promise`) e tratamento de erros.
   - Estados visuais de carregamento (`ActivityIndicator`) e erro com botão "Tentar Novamente".
   - Barra de busca em tempo real por nome, número ou partido.
   - Filtros dinâmicos por espectro político (Esquerda, Centro, Direita) e cargo.

3. **Perfil Detalhado do Candidato (`/candidato/[id]`):**
   - Foto, nome, número eleitoral em destaque, cargo, partido e biografia contextualizada no estado de MG.
   - Badges temáticos e status eleitoral (*"Eleito"* / *"Não Eleito"*).
   - Propostas de governo para Minas Gerais.
   - Botão para salvar/remover o candidato na **Minha Cola** persistido offline no `@react-native-async-storage/async-storage`.
   - Atalho direto para testar o voto deste candidato na urna eletrônica.

4. **Simulador de Urna Eletrônica:**
   - Reprodução fidedigna da urna eletrônica do TSE/TRE-MG.
   - Visor digital interativo com busca em tempo real conforme os dígitos são digitados.
   - Exibição de foto do candidato, nome e partido no visor.
   - Tratamento de **Voto Nulo** (número inválido) e **Voto em Branco**.
   - Teclado com teclas clássicas **BRANCO**, **CORRIGE** e **CONFIRMA**.
   - Tela final de **FIM** com sinal sonoro simulado (*PILILILI*).
   - Registro de votos simulados armazenado e totalizado no `AsyncStorage` com opção de Zerésima.

5. **Minha Cola Eleitoral (Offline):**
   - Acesso rápido aos candidatos selecionados pelo eleitor.
   - Persistência permanente no dispositivo via `AsyncStorage`.
   - Remoção individual de candidatos da cola ou limpeza total.
   - Filtro por cargo e botão para treinar diretamente na urna.

---

## 🏗️ Estrutura de Diretórios

```
voto-minas/
├── src/
│   ├── app/
│   │   ├── _layout.tsx              # Stack Navigator raiz
│   │   ├── (tabs)/
│   │   │   ├── _layout.tsx          # Bottom Tabs Navigator (4 abas)
│   │   │   ├── index.tsx            # Aba 1: Dashboard Início
│   │   │   ├── candidatos.tsx       # Aba 2: Lista com Busca e Filtros
│   │   │   ├── urna.tsx             # Aba 3: Urna Eletrônica Interativa
│   │   │   └── favoritos.tsx        # Aba 4: Minha Cola (Favoritos)
│   │   └── candidato/
│   │       └── [id].tsx             # Rota Dinâmica: Detalhes do Candidato
│   ├── components/
│   │   ├── Badge.tsx                # Badges estilizados (Cargo, Lado, Eleito)
│   │   ├── CandidateCard.tsx        # Card reutilizável na lista e favoritos
│   │   └── UrnaTeclado.tsx          # Teclado realista da urna (0-9, BRANCO, CORRIGE, CONFIRMA)
│   ├── services/
│   │   ├── api.ts                   # Camada de comunicação com a API do Gist (785 candidatos)
│   │   └── storage.ts               # Persistência via @react-native-async-storage
│   └── types/
│       └── candidato.ts             # Tipos TypeScript do domínio eleitoral
```

---

## 🛠️ Tecnologias Utilizadas

- **React Native** & **React 19**
- **Expo SDK 58**
- **Expo Router** (Roteamento baseado em arquivos com Stack e Bottom Tabs)
- **TypeScript** (Tipagem estrita e validação total)
- **@react-native-async-storage/async-storage** (Armazenamento local offline)
- **API Externa de Dados Reais de MG** (GitHub Gist com 785 candidatos do TRE-MG)
- **@expo/vector-icons** (Ionicons)
- **React Native Safe Area Context**

---

## 🚀 Como Executar o Projeto

1. Instale as dependências caso ainda não tenha feito:
   ```bash
   npm install
   ```

2. Inicie o servidor de desenvolvimento do Expo:
   ```bash
   npx expo start
   ```

3. Escolha uma das opções:
   - Pressione `a` para rodar no emulador **Android**.
   - Pressione `i` para rodar no simulador **iOS**.
   - Pressione `w` para rodar no **Navegador Web**.
   - Ou escaneie o QR Code com o aplicativo **Expo Go** em seu dispositivo físico.

---

## 🧪 Validação de Código e Qualidade

O projeto está configurado com validações estritas de TypeScript e ESLint:

```bash
# Verificação de Tipos TypeScript (Zero erros)
npx tsc --noEmit

# Linting de Código (Zero warnings/erros)
npx eslint src
```
