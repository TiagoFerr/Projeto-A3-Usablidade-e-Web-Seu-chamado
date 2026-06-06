---
name: Seu Chamado
description: Sistema corporativo de chamados de TI com foco em usabilidade (IHC)
colors:
  primary: "#2563eb"
  neutral-bg: "#f8fafc"
  neutral-surface: "#ffffff"
  neutral-border: "#cbd5e1"
  success: "#065f46"
  warning: "#9a3412"
  danger: "#991b1b"
typography:
  display:
    fontFamily: "Outfit, Inter, sans-serif"
    fontSize: "1.8rem"
    fontWeight: 700
    lineHeight: 1.2
  body:
    fontFamily: "Inter, sans-serif"
    fontSize: "0.95rem"
    fontWeight: 400
    lineHeight: 1.5
rounded:
  sm: "6px"
  md: "8px"
  lg: "12px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
---

# Design System: Seu Chamado (Corporate Light Mode)

## 1. Overview

**Creative North Star: "The Solid Support Desk"**

O design visual do "Seu Chamado" rejeita o visual "futurista de IA" (como temas dark com degradês de neon e transparências excessivas). Ele adota um **Tema Claro Corporativo e Sóbrio**, inspirado nos padrões visuais do **GitHub** e **TailwindUI**. O objetivo central é destacar a aplicação das **10 Heurísticas de Usabilidade de Jakob Nielsen** e garantir o maior **Contraste de Acessibilidade (WCAG)** possível.

**Key Characteristics:**
- **Máximo Contraste de Leitura:** Fundo claro neutro com textos escuros sólidos, facilitando a leitura por períodos prolongados.
- **Estruturas Sólidas:** Sem desfoques (`backdrop-filter`) ou decorações desnecessárias. Bordas cinzas sólidas e elevações reais delimitam os espaços de trabalho.
- **Feedback de Interação:** O sistema informa o status de cada ação com cores semânticas bem demarcadas e alterações imediatas de estado (Heurística #1).

## 2. Colors

A paleta de cores é estritamente funcional, servindo para guiar a navegação e o status dos chamados.

### Primary
- **Corporate Blue** (#2563eb): O azul corporativo padrão para elementos interativos primários (links ativos, botões de ação e foco de inputs).

### Neutral
- **Slate Background** (#f8fafc): Cor cinza-clara de fundo, reduzindo o brilho branco puro da tela para maior conforto visual.
- **Pure White Surface** (#ffffff): Fundo das colunas do Kanban, cartões de chamados e modais.
- **Slate Border** (#cbd5e1): Bordas cinzas sólidas e bem visíveis que delimitam os cartões e colunas.

### Semantic
- **Todo (Pendente):** Fundo cinza suave (#f1f5f9), borda cinza (#cbd5e1) e texto cinza-escuro (#475569).
- **In Progress (Em Atendimento):** Fundo laranja suave (#fef3c7), borda amarela (#fde68a) e texto marrom/laranja escuro (#9a3412).
- **Review (Em Revisão):** Fundo roxo suave (#f3e8ff), borda roxa (#e9d5ff) e texto roxo-escuro (#6b21a8).
- **Done (Concluído):** Fundo verde suave (#d1fae5), borda verde (#a7f3d0) e texto verde-escuro (#065f46).

### Named Rules
**The Solid Borders Rule.** Divisões devem usar bordas sólidas visíveis (espessura mínima 1px), garantindo clareza espacial. Não use transparências ou fusões de cor para simular bordas.

## 3. Typography

**Display Font:** Outfit
**Body Font:** Inter

### Hierarchy
- **Display** (Bold (700), 1.8rem, 1.2): Logotipo da marca e título do painel.
- **Headline** (SemiBold (600), 1.2rem, 1.3): Títulos de colunas e modais.
- **Title** (SemiBold (600), 0.95rem, 1.4): Título do chamado no cartão.
- **Body** (Regular (400), 0.95rem, 1.5): Descrição de chamados e campos de texto.
- **Label** (Medium (500), 0.75rem, uppercase): Rótulos de formulário e pequenas tags de dados.

## 4. Elevation

O sistema utiliza sombras cinzas suaves nativas do navegador para indicar o empilhamento de modais e o arraste de elementos interativos.

### Named Rules
**The Drop Shadow Elevation Rule.** Cartões de chamados em repouso possuem apenas uma borda cinza fina. No estado de pairar (hover) ou arraste (drag), é aplicada uma sombra de elevação cinza suave (`box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -2px rgba(0,0,0,0.1)`) para simular elevação física.

## 5. Components

### Buttons
- **Shape:** Arredondamento padrão de 8px.
- **Primary:** Azul Corporativo (#2563eb) com texto branco. 
- **Secondary:** Fundo branco com borda cinza e texto cinza-escuro.

### Cards / Containers
- **Corner Style:** Arredondamento padrão de 8px.
- **Background:** Branco puro (#ffffff).
- **Border:** Cinza sólido (#cbd5e1).

### Inputs / Fields
- **Style:** Fundo branco com borda cinza bem visível. Rótulos sempre visíveis (evitando ocultação).
- **Focus:** No foco, a borda assume a cor Azul Corporativo (#2563eb).

## 6. Do's and Don'ts

### Do:
- **Do** Manter o contraste de leitura de todos os textos (incluindo descrições de chamados) sempre em conformidade com a WCAG (mínimo 4.5:1, idealmente > 7:1).
- **Do** Indicar visualmente através de um ícone de cadeado ou cursor de bloqueio (`cursor: not-allowed`) quando o usuário for um Cliente e não puder arrastar os chamados no Kanban (Heurística de Prevenção de Erros).
- **Do** Exibir um balão de alerta claro contendo a contagem de chamados ativos em cada coluna (Heurística #1).

### Don't:
- **Don't** Usar fundos pretos ou roxos com brilhos/gradientes de neon (cara de IA/cripto).
- **Don't** Usar transparência (`opacity` ou cores RGBA com baixa opacidade) no fundo de cartões de chamados ou de modais, o que prejudica a legibilidade do texto que fica abaixo.
- **Don't** Usar bordas coloridas grossas em cartões para indicar prioridade (evitar SaaS cliché). Use tags internas ou pequenos círculos de cor.
- **Don't** Ocultar mensagens de erro em caixas de diálogo genéricas (ex: "Ocorreu um erro"). Aponte o erro no próprio campo afetado.
