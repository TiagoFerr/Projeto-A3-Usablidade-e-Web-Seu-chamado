# Relatório de Projeto Acadêmico (Avaliação A3)
## Sistema "Seu Chamado" - Kanban de Suporte de TI

Este documento constitui o **Relatório Completo de Projeto** da aplicação **Seu Chamado**, desenvolvida para a avaliação **A3** na disciplina de **Usabilidade, desenvolvimento web, mobile e jogos**.

---

## 👨‍💻 Identificação do Projeto
* **Nome do Projeto:** Seu Chamado
* **Disciplina:** Usabilidade, desenvolvimento web, mobile e jogos
* **Objetivo Geral:** Aplicar conceitos de Usabilidade, Design de Interfaces, prototipagem e implementação técnica de sistemas web.
* **Autor:** Tiago Ferreira (GitHub: [@TiagoFerr](https://github.com/TiagoFerr))
* **Tecnologia Principal:** Vanilla Web Stack (HTML/CSS/JS puros) no frontend, Node.js no backend e PostgreSQL como banco de dados.

---

## 1. 📝 Introdução e Contexto do Produto

No ambiente de suporte de tecnologia (Help Desk), a agilidade e a clareza na triagem de incidentes são críticas. Sistemas legados costumam falhar ao apresentar tabelas textuais densas, com baixo contraste e fluxos complexos que induzem o usuário ao erro ao abrir ou mover solicitações.

O **Seu Chamado** foi concebido para resolver essas fricções, fornecendo uma interface visual baseada em quadros **Kanban**. Ele foi projetado sob os pilares da **Interação Homem-Computador (IHC)**, garantindo que o design apoie a tarefa do usuário, limite sua carga cognitiva e previna erros operacionais.

### Objetivos do Sistema:
1. **Centralização:** Permitir o registro, triagem, atribuição e resolução de chamados em uma plataforma única.
2. **Eficiência Espacial:** Organizar os chamados visualmente por estado de atendimento (Pendente, Em Atendimento, Em Revisão e Concluído).
3. **Segurança de Nível Corporativo:** Garantir que o perfil técnico gerencie o fluxo, enquanto os clientes mantêm a autonomia sobre seus próprios chamados.

---

## 2. 👥 Perfis de Usuários (Roles) e IHC

O sistema foi modelado para atender a dois perfis distintos de usuários com necessidades e restrições de IHC específicas:

### A. Cliente (Funcionário Solicitante)
* **Necessidades:** Interface de abertura rápida de chamados, clareza sobre o andamento e capacidade de atualizar ou fechar chamados que ele mesmo abriu.
* **Restrições de IHC:** Não deve ter permissão para arrastar ou mover chamados de outros setores ou alterar atribuições de técnicos. Para evitar cliques acidentais, a interface de arrastar (Drag and Drop) é desativada para este perfil. Ele visualiza indicadores visuais de cadeado nos cartões e altera o status de seus próprios chamados exclusivamente através do painel de detalhes.

### B. Técnico de TI (Analista de Suporte)
* **Necessidades:** Visualização geral da fila de trabalho, triagem rápida, facilidade para assumir chamados e mover solicitações de acordo com a evolução do atendimento.
* **Permissões de IHC:** Liberdade total de movimentação de cartões por meio de arrastar e soltar (Drag and Drop), gerenciamento de atribuição de técnicos nos cartões e exclusão geral.

---

## 3. 🎨 Design System e Contraste (IHC & Acessibilidade)

Em vez de adotar um visual com "cara de IA" (com fundos pretos escuros, néons brilhantes e efeitos de vidro que geram poluição visual e cansaço em uso prolongado), o sistema adota o padrão **Corporate Light Mode**, inspirado em interfaces modernas como as do GitHub e TailwindUI.

### Diretrizes Visuais Aplicadas (DESIGN.md):
* **Fundo Neutro Confortável:** O fundo usa o tom `#f8fafc` (cinza-claro azulado), reduzindo o estresse ocular em relação ao branco puro.
* **Regra das Bordas Sólidas (The Solid Borders Rule):** O design evita o uso de divisões implícitas ou transparentes. Cada coluna e cartão é cercado por uma borda sólida e visível (`#cbd5e1`), garantindo que o cérebro do usuário faça a separação física imediata dos elementos.
* **Regra de Elevação por Sombra (The Drop Shadow Elevation Rule):** Cartões em repouso são planos (flat). Quando o usuário paira o mouse (hover) ou inicia o arraste (drag), o cartão recebe uma sombra projetada sutil. Isso simula o levantamento físico do elemento em três dimensões, fornecendo feedback de profundidade imediata ao usuário.
* **Acessibilidade de Contraste (WCAG):** Todos os textos em tags semânticas atendem à taxa mínima de contraste de 4.5:1. As cores semânticas de status utilizam fundos pastéis claros combinados com textos escuros de alto contraste:
  * **Pendente:** Fundo `#f1f5f9` | Texto `#475569` (Cinza)
  * **Em Atendimento:** Fundo `#ffedd5` | Texto `#9a3412` (Laranja)
  * **Em Revisão:** Fundo `#f3e8ff` | Texto `#6b21a8` (Roxo)
  * **Concluído:** Fundo `#d1fae5` | Texto `#065f46` (Verde)

---

## 🧠 4. Aplicação Prática das 10 Heurísticas de Usabilidade de Nielsen

O frontend foi desenvolvido com foco absoluto na aplicação das heurísticas de Jakob Nielsen:

### 1. Visibilidade do Status do Sistema
* **Contadores Dinâmicos:** Cada coluna no topo exibe a contagem em tempo real de chamados daquele estado (ex: `PENDENTE [3]`).
* **Hover de Arraste:** Quando um chamado está sendo arrastado sobre uma coluna, a cor de fundo da coluna altera-se imediatamente para um azul suave (`#eff6ff`) com borda destacada, indicando que a área está pronta para receber o drop.
* **Notificação de Estado:** Mensagens toast e alertas no topo indicam claramente se a conexão com o banco de dados e APIs está operacional.

### 2. Compatibilidade do Sistema com o Mundo Real
* **Terminologia Familiar:** O sistema adota expressões do cotidiano do suporte: "Baixa/Média/Alta" para prioridades, "Hardware/Software/Rede" para categorias e "Pendente/Em Atendimento/Revisão/Concluído" para o fluxo.
* **Ícones Intuitivos:** Utilização de ícones de cadeados, usuários e exclamações da biblioteca Remix Icon que representam as ações do mundo real.

### 3. Controle e Liberdade do Usuário
* **Confirmação e Cancelamento:** Modais possuem botões explícitos para cancelar a operação.
* **Exclusão Controlada:** O usuário pode excluir ou alterar o chamado caso cometa um engano, desde que possua a propriedade do chamado ou o cargo de técnico.

### 4. Consistência e Padrões
* **Design Consistente:** Toda a interface obedece estritamente ao arredondamento de cantos (`8px` para inputs e botões, `12px` para modais e colunas) e à mesma família de fontes (Outfit para títulos corporativos e Inter para textos corridos).

### 5. Prevenção de Erros
* **Submit Lock:** O botão de envio do chamado permanece desabilitado (`disabled`) com opacidade reduzida até que o formulário atenda às restrições mínimas (Título com mais de 5 caracteres e Descrição com mais de 10 caracteres). Isso impede que chamados em branco ou sem nexo sejam enviados acidentalmente.
* **Aviso de Perda de Rascunho:** Se o usuário preencher o formulário e tentar fechar a janela (clicando no Cancelar, no fechar `X` ou fora do modal), o sistema intercepta a ação e exibe uma confirmação: *"Você começou a preencher o chamado. Tem certeza de que deseja descartar este rascunho? O conteúdo digitado será perdido."*, prevenindo a perda involuntária de digitação.
* **Confirmação de Ações Críticas (Exclusão e Encerramento):** Para evitar cliques acidentais (*missclicks*):
  * **Exclusão de Chamado:** Solicita confirmação explícita (*"Tem certeza de que deseja excluir permanentemente este chamado?"*).
  * **Sair da Conta (Logout):** Solicita confirmação antes de deslogar o usuário (*"Tem certeza de que deseja sair da sua conta?"*).

### 6. Reconhecimento em Vez de Memorização
* **Dropdown de Atribuição:** A lista de técnicos de TI cadastrados é populada em tempo real no banco e exibida em um seletor visual. O usuário técnico escolhe o responsável a partir de uma lista estruturada em vez de ter que memorizar e digitar o nome ou e-mail de cabeça.

### 7. Flexibilidade e Eficiência de Uso
* **Controle Híbrido:** Usuários experientes (Técnicos) movem chamados rapidamente com Drag and Drop no Kanban. Clientes gerenciam seus chamados diretamente clicando neles e alterando o status via seletor dropdown, fornecendo um fluxo otimizado para as respectivas necessidades.

### 8. Estética e Design Minimalista
* **Eliminação do Supérfluo:** Não há elementos decorativos ou dados irrelevantes no cartão de chamados. Apenas o essencial é renderizado na tela principal: prioridade, categoria, título, descrição curta, responsável e data de criação.

### 9. Ajuda os Usuários a Reconhecerem, Diagnosticarem e Recuperarem-se de Erros
* **Validação no Foco de Saída (Blur):** As mensagens de erro e a borda vermelha indicadora do input só aparecem após o usuário sair do campo de preenchimento (`blur`) caso ele o deixe vazio ou incompleto. Isso evita que erros sejam mostrados na cara do usuário enquanto ele ainda está no meio do processo de digitação.

### 10. Ajuda e Documentação
* **Placeholders Contextuais:** Dicas e formatos esperados aparecem diretamente nos placeholders de texto (ex: `Ex: Computador não liga após queda de energia`).

---

## 🛠️ 5. Arquitetura do Sistema e Tecnologias

A aplicação utiliza uma arquitetura clássica **Monolítica Baseada em Serviços**:

```
[ Frontend: HTML/CSS/JS (Vanilla) ] <--- HTTP REST ---> [ Backend: Node.js (Express) ] <--- Connection Pool ---> [ PostgreSQL ]
```

* **Frontend:** Implementado com HTML5 estrutural e CSS3 com variáveis de design. A lógica em JavaScript nativo consome a API através de requisições Fetch assíncronas.
* **Backend:** Servidor Node.js utilizando o framework minimalista **Express**. A segurança é feita com geração e leitura de tokens **JWT** envelopados em cookies HTTP-Only seguros (impedindo ataques de roubo de sessão via scripts maliciosos - XSS).
* **Banco de Dados:** PostgreSQL para armazenamento persistente de tabelas relacionais de usuários e chamados.

---

## 🗄️ 6. Modelagem e Estrutura do Banco de Dados

O banco de dados do projeto conta com uma modelagem relacional expandida para suportar as novas funcionalidades de controle de suporte:

```mermaid
erDiagram
    USERS {
        SERIAL id PK
        VARCHAR name
        VARCHAR email UNIQUE
        VARCHAR password_hash
        VARCHAR role "client | tech"
        TIMESTAMP created_at
    }
    TICKETS {
        SERIAL id PK
        VARCHAR title
        TEXT description
        VARCHAR status "todo | in_progress | review | done"
        VARCHAR priority "low | medium | high"
        VARCHAR category "hardware | software | network | other"
        INT created_by FK "users.id"
        INT assigned_to FK "users.id"
        TIMESTAMP created_at
        TIMESTAMP updated_at
    }
    TICKET_ACTIVITIES {
        SERIAL id PK
        INT ticket_id FK "tickets.id"
        INT user_id FK "users.id"
        VARCHAR action_desc
        TIMESTAMP created_at
    }
    TICKET_COMMENTS {
        SERIAL id PK
        INT ticket_id FK "tickets.id"
        INT user_id FK "users.id"
        TEXT content
        TIMESTAMP created_at
    }
    TICKET_SUBTASKS {
        SERIAL id PK
        INT ticket_id FK "tickets.id"
        VARCHAR title
        BOOLEAN is_completed
        TIMESTAMP created_at
    }
    USERS ||--o{ TICKETS : "cria (created_by)"
    USERS ||--o{ TICKETS : "atribuido_a (assigned_to)"
    TICKETS ||--o{ TICKET_ACTIVITIES : "possui"
    USERS ||--o{ TICKET_ACTIVITIES : "registra"
    TICKETS ||--o{ TICKET_COMMENTS : "possui"
    USERS ||--o{ TICKET_COMMENTS : "escreve"
    TICKETS ||--o{ TICKET_SUBTASKS : "contém"
```

### Auto-Migrações e Resiliência
Para suportar o ambiente de containers Docker (onde o banco de dados pode demorar alguns segundos a mais para inicializar em relação à aplicação Node), o arquivo `db.js` implementa:
1. **Lógica de Retry (Tentativas):** O backend tenta se conectar ao PostgreSQL até 6 vezes consecutivas com um intervalo de 5 segundos entre as tentativas antes de abortar o processo.
2. **Auto-inicialização de Tabelas:** O script verifica a existência e cria automaticamente as tabelas `users`, `tickets`, `ticket_activities`, `ticket_comments` e `ticket_subtasks` caso não existam no banco de dados.

---

## 🎨 7. Novas Funcionalidades de Enriquecimento (IHC & Usabilidade)

Para levar o sistema a um patamar corporativo profissional de usabilidade (@impeccable), foram integradas as seguintes melhorias guiadas pelas **Heurísticas de Nielsen**:

1. **Navegação Distribuída por Abas (Tab Selector):** Para evitar a saturação de informações e manter o foco na tarefa atual, a interface principal foi distribuída em três abas:
   * **Quadro Kanban:** Área limpa dedicada exclusivamente à triagem e fluxo de movimentação dos chamados.
   * **Estatísticas & Relatórios:** Painel agregador com métricas gerais e gráficos de distribuição.
   * **Histórico Geral:** Linha do tempo linear global com as últimas 50 ações registradas na base.
   *(Heurística #8 - Estética e Design Minimalista / Heurística #7 - Flexibilidade e Eficiência)*.
2. **Painel de Estatísticas e Métricas Expandido:** Exibe contadores do total de chamados, a taxa de resolução (%) e a distribuição das categorias, além de novos painéis dedicados à volumetria de chamados por **Prioridade** e por **Status** com barras de progresso dinâmicas de cores institucionais. *(Heurística #1 - Visibilidade do Status do Sistema)*.
3. **Controle de SLA Dinâmico por Prioridade:** Os cartões do Kanban e o modal de detalhes exibem cronômetros de contagem regressiva para a resolução (Alta: 4h, Média: 24h, Baixa: 72h) com alertas estéticos de atraso ("SLA Estourado"). *(Heurística #1 - Visibilidade e Heurística #8 - Estética Minimalista)*.
4. **Timeline de Atividades (Activity Log) & Histórico Geral:** Registra e renderiza um histórico completo de alterações ocorridas no chamado em ordem cronológica. Na aba "Histórico Geral", as atividades contam com links clicáveis que abrem instantaneamente os detalhes do chamado correspondente. *(Heurística #1 - Visibilidade e Heurística #2 - Compatibilidade)*.
5. **Central de Comentários Interna:** Permite uma área de bate-papo entre o funcionário solicitante e o técnico responsável diretamente no modal de detalhes do chamado. *(Heurística #7 - Flexibilidade e Eficiência de Uso)*.
6. **Checklist de Subtarefas Técnicas:** Exclusivo para técnicos, possibilita a decomposição do chamado em micro-tarefas interativas que podem ser marcadas ou deletadas, prevenindo o esquecimento de rotinas de suporte críticas. *(Heurística #5 - Prevenção de Erros e Heurística #6 - Reconhecimento)*.
7. **Modo Escuro Sóbrio (Dark Mode):** Um alternador persistente (via `localStorage`) na navbar que altera dinamicamente as variáveis de design para um tema escuro e plano com bordas sólidas marcadas, atendendo a altos critérios de contraste de acessibilidade para uso contínuo sem fadiga ocular. *(Heurística #8 - Minimalismo & Acessibilidade)*.

---

## ⚙️ 8. Instruções para Executar o Projeto

Você pode rodar o projeto de duas formas: usando Docker (ambiente isolado recomendado) ou instalando localmente na sua máquina.

### Método 1: Usando Docker (Recomendado)
Certifique-se de ter o **Docker** e o **Docker Compose** instalados e funcionando em sua máquina.

1. Navegue até a pasta raiz do projeto.
2. Execute o comando para subir os containers e limpar caches antigos:
   ```bash
   docker-compose down -v && docker-compose up --build
   ```
3. O Docker iniciará automaticamente dois serviços:
   * **seu_chamado_db_container:** Rodando PostgreSQL na porta padrão interna `5432`.
   * **seu_chamado_app_container:** Servidor Node.js rodando na porta externa `3000`.
4. Acesse no seu navegador: **[http://localhost:3000](http://localhost:3000)**

---

### Método 2: Execução Local (Sem Docker)
Caso deseje rodar a aplicação diretamente no sistema operacional:

1. **Configure o Banco de Dados:** Crie um banco vazio no seu PostgreSQL local chamado `seu_chamado_db`.
2. **Defina as Variáveis de Ambiente:** Crie ou altere o arquivo `.env` na raiz do projeto configurando as credenciais de acesso ao seu banco de dados local:
   ```env
   PORT=3000
   JWT_SECRET=sua_chave_secreta_aqui
   DB_HOST=localhost
   DB_PORT=5432
   DB_USER=seu_usuario_postgres
   DB_PASSWORD=sua_senha_postgres
   DB_NAME=seu_chamado_db
   ```
3. **Instale as dependências:**
   ```bash
   npm install
   ```
4. **Execute o servidor de desenvolvimento:**
   ```bash
   npm run dev
   ```
5. Acesse no seu navegador: **[http://localhost:3000](http://localhost:3000)**

---

## 🔑 9. Credenciais Pré-configuradas para Teste (Seed)

Ao inicializar o banco de dados pela primeira vez, o sistema insere automaticamente uma conta com perfil de **Técnico de TI** para que você possa avaliar as funcionalidades de arrastar cartões e atribuir responsáveis imediatamente:

* **E-mail:** `suporte@seuchamado.com.br`
* **Senha:** `123456`

*(Você também pode se cadastrar livremente com qualquer e-mail no formulário da página inicial e selecionar se deseja o perfil de **Cliente** ou **Técnico**).*

