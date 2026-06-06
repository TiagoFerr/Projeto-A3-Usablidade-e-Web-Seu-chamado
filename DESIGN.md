---
name: Seu Chamado
description: Sistema de chamados de TI no formato Kanban corporativo
colors:
  primary: "#6366f1"
  neutral-bg: "#090d16"
  neutral-surface: "#0f1626"
  neutral-border: "#1e293b"
  success: "#10b981"
  warning: "#f59e0b"
  danger: "#f43f5e"
typography:
  display:
    fontFamily: "Outfit, Inter, sans-serif"
    fontSize: "2rem"
    fontWeight: 700
    lineHeight: 1.2
  body:
    fontFamily: "Inter, sans-serif"
    fontSize: "0.95rem"
    fontWeight: 400
    lineHeight: 1.5
rounded:
  sm: "8px"
  md: "14px"
  lg: "20px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
---

<!-- SEED: re-run /impeccable document once code files are finalized to sync changes. -->

# Design System: Seu Chamado

## 1. Overview

**Creative North Star: "The Clean Operations Board"**

O design do "Seu Chamado" segue uma linha corporativa sóbria, inspirada nas interfaces funcionais do GitHub e Notion, implementadas sobre um tema escuro (Dark Mode) de alto contraste. Cada elemento visual é projetado em torno das **10 Heurísticas de Usabilidade de Jakob Nielsen**, focando no feedback instantâneo de ações e no baixo esforço cognitivo para o gerenciamento de chamados.

**Key Characteristics:**
- **Feedback de Status Imediato:** Colunas do Kanban atualizam dinamicamente a contagem e mudam de cor discretamente durante interações de arraste.
- **Prevenção de Erros:** Inputs e modais possuem marcações claras, botões de ação desabilitados quando inválidos e mensagens de erro explícitas.
- **Consistência e Padrão:** Botões e inputs seguem padrões idênticos em todas as telas, facilitando o aprendizado (reconhecimento ao invés de memorização).

## 2. Colors

A paleta de cores é sóbria, limitando o uso de cores brilhantes para dar máxima importância semântica aos status dos chamados.

### Primary
- **Indigo Accent** (#6366f1): Usado exclusivamente para elementos interativos primários (links ativos, botões primários de ação e foco em inputs).

### Neutral
- **Slate Background** (#090d16): A cor de fundo principal do aplicativo, ideal para uso prolongado pela equipe de TI sem fadiga ocular.
- **Card Surface** (#0f1626): Fundo para containers de colunas e cartões de chamados, criando um contraste sutil de elevação.
- **Border Slate** (#1e293b): Divisórias finas e discretas para delimitar áreas.

### Semantic
- **Success/Done** (#10b981): Verde para chamados concluídos e prioridade baixa.
- **Warning/Progress** (#f59e0b): Amarelo/Laranja para chamados em atendimento e prioridade média.
- **Danger/High** (#f43f5e): Vermelho para chamados pendentes/críticos e prioridade alta.

### Named Rules
**The 10% Contrast Rule.** Cores vibrantes (como o azul índigo ou os indicadores semânticos de erro) não devem cobrir mais do que 10% da tela, garantindo que o olho do usuário seja atraído apenas para o que realmente importa.

## 3. Typography

**Display Font:** Outfit
**Body Font:** Inter

A tipografia utiliza a força da Outfit para títulos (impondo autoridade e profissionalismo) e o conforto da Inter para leitura de descrições e formulários.

### Hierarchy
- **Display** (Bold (700), 2rem, 1.2): Usado no título do Dashboard e logotipo da marca.
- **Headline** (SemiBold (600), 1.25rem, 1.3): Títulos de colunas do Kanban e modais.
- **Title** (Medium (500), 1rem, 1.4): Títulos dos cartões de chamados.
- **Body** (Regular (400), 0.95rem, 1.5): Descrição de chamados e preenchimento de inputs.
- **Label** (Medium (500), 0.75rem, uppercase): Rótulos de formulários e pequenas tags de status/prioridade.

## 4. Elevation

O sistema é predominantemente bidimensional (flat), utilizando tonalidades contrastantes para indicar profundidade. Sombras são reservadas exclusivamente para estados interativos.

### Named Rules
**The Interaction Shadow Rule.** Cartões de chamados não possuem sombras em repouso. Uma sombra difusa de elevação (`box-shadow: 0 10px 20px -5px rgba(0,0,0,0.4)`) é aplicada somente no estado de pairar (hover) ou de arrastar (drag), simulando que o objeto físico foi levantado do painel.

## 5. Components

### Buttons
- **Shape:** Arredondamento médio (14px).
- **Primary:** Fundo Indigo (#6366f1) com texto branco. Possui uma transição suave de 0.2s para hover.
- **Secondary:** Fundo translúcido com borda cinza fina. Transita para fundo opaco no hover.

### Cards / Containers
- **Corner Style:** Arredondamento suave (14px).
- **Background:** Fundo escuro levemente mais claro que a página (#0f1626).
- **Border:** Borda fina sutil (#1e293b).

### Inputs / Fields
- **Style:** Fundo escuro com borda sutil. Rótulo posicionado acima do input.
- **Focus:** No foco, a borda assume a cor Indigo (#6366f1) com um anel de brilho sutil ao redor.

## 6. Do's and Don'ts

### Do:
- **Do** Manter a taxa de contraste de todo texto de chamados e formulários em conformidade com as diretrizes de acessibilidade (mínimo 4.5:1).
- **Do** Adicionar feedback imediato quando um chamado é arrastado de uma coluna para outra, confirmando visualmente a conclusão da ação (Heurística #1).
- **Do** Garantir que o usuário possa fechar modais ou cancelar ações facilmente com botões explícitos de "Voltar" ou "Cancelar" (Heurística #3).

### Don't:
- **Don't** Usar gradientes berrantes ou textos em degradê no painel. O design deve ser corporativo e limpo.
- **Don't** Utilizar bordas coloridas grossas em cartões para indicar prioridade (evitar SaaS cliché). Use tags internas ou pequenos círculos de cor.
- **Don't** Esconder informações de erro críticas em modais genéricos. Mostre o erro logo ao lado do campo relevante (ex: "E-mail inválido").
