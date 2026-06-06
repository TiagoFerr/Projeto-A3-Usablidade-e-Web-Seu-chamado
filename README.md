# Seu Chamado - Sistema de Chamados de TI (Kanban)

Este é um projeto acadêmico de engenharia web desenvolvido para a disciplina de **Engenharia de Software, Interface Homem-Computador (IHC) e Usabilidade**. O sistema gerencia solicitações de suporte de tecnologia através de um quadro visual **Kanban**, implementando conceitos práticos de controle de acessos, segurança, persistência relacional e usabilidade profissional.

O projeto adota ferramentas fundamentais da web (**HTML, CSS e JavaScript puros**) no frontend, demonstrando que a aplicação rigorosa de boas práticas de design e arquitetura independe do uso de frameworks complexos.

---

## 🚀 Tecnologias e Dependências

### Frontend (Vanilla)
* **HTML5:** Semântica nativa para acessibilidade estrutural.
* **CSS3:** Paleta corporativa sob medida (Light Mode), layouts flexíveis (Flexbox e CSS Grid) e animações suaves de transição.
* **JavaScript (ES6):** Manipulação de DOM nativa, requisições Fetch assíncronas e controle da API HTML5 de Drag and Drop.
* **Remix Icon CDN:** Biblioteca de ícones vetoriais modernos e minimalistas.

### Backend (Node.js)
* **Express:** Roteamento de APIs REST e fornecimento de recursos estáticos.
* **PG (node-postgres):** Pool de conexões e execução de queries SQL no PostgreSQL.
* **Bcryptjs:** Criptografia unidirecional com salting para segurança de senhas de usuários.
* **JSON Web Token (JWT):** Geração de assinaturas criptografadas de sessão.
* **Cookie Parser:** Leitura segura de tokens de sessão enviados via cabeçalhos HTTP.
* **Dotenv:** Gerenciamento isolado de variáveis de ambiente.

### Banco de Dados & Infraestrutura
* **PostgreSQL 15:** Banco de dados relacional.
* **Docker & Docker Compose:** Containerização e orquestração do ambiente completo.

---

## 🧠 Heurísticas de Usabilidade Aplicadas (Jakob Nielsen)

O design e fluxo do "Seu Chamado" foram projetados inteiramente em cima das **10 Heurísticas de Jakob Nielsen**, com destaque para a prevenção e tratamento amigável de erros:

1. **Visibilidade do status do sistema (Heurística #1):**
   * Contadores numéricos dinâmicos no cabeçalho das colunas do Kanban atualizam o volume de chamados na hora.
   * Transições visuais imediatas com alteração da cor de fundo da coluna do Kanban durante o arraste do cartão de chamado.
   * Mensagens de alerta no topo do painel identificam o perfil logado e as ações permitidas.
2. **Compatibilidade do sistema com o mundo real (Heurística #2):**
   * Nomenclaturas reais do setor de tecnologia (Pendente, Em Atendimento, Em Revisão, Concluído).
   * Ícones intuitivos indicando prioridades (Alta/Média/Baixa) e categorias de chamados (Hardware, Software, Redes).
3. **Controle e liberdade do usuário (Heurística #3):**
   * Botões explícitos para cancelar aberturas de chamados.
   * Botão de exclusão para remover chamados criados incorretamente (disponível para técnicos ou o próprio criador).
4. **Consistência e padrões (Heurística #4):**
   * Botões primários, secundários e inputs seguem a mesma identidade de bordas sólidas, arredondamentos (8px) e tipografia Outfit/Inter.
5. **Prevenção de erros (Heurística #5):**
   * **Submit Lock:** O botão "Confirmar Abertura" inicia bloqueado (`disabled`) e só é liberado quando o título tem no mínimo 5 caracteres e a descrição 10.
   * **Aviso de Descarte:** Se o usuário preencher o formulário de abertura e tentar fechar a janela (clicando no Cancelar, no fechar `X` ou fora do modal), o sistema exibe uma confirmação para evitar a perda acidental do rascunho.
6. **Reconhecimento em vez de memorização (Heurística #6):**
   * Dropdown dinâmico para atribuição de técnicos de suporte. O usuário escolhe a partir de uma lista visual em vez de precisar lembrar e digitar o e-mail ou código do técnico.
7. **Flexibilidade e eficiência de uso (Heurística #7):**
   * Técnicos podem arrastar cartões de chamados diretamente no painel Kanban.
   * Usuários comuns (Clientes) visualizam o painel com indicadores de cadeado e podem alterar o status do chamado selecionando uma caixa de opções dentro do modal de detalhes, adaptando a eficiência ao perfil de acesso.
8. **Estética e design minimalista (Heurística #8):**
   * Visual "Corporate Light Mode" limpo, livre de degradês de neon brilhantes ou efeitos transparentes. Foco total em dados legíveis e bordas discretas.
9. **Ajuda os usuários a reconhecerem, diagnosticarem e recuperarem-se de erros (Heurística #9):**
   * **Validação por Foco de Saída (Blur):** As mensagens de erro e as bordas vermelhas do formulário só aparecem se o usuário interagir e sair do campo deixando-o incompleto. Não há alertas pulando na tela enquanto o usuário digita.
10. **Ajuda e documentação (Heurística #10):**
    * Placeholders explicativos e exemplos dentro dos campos de texto (ex: `Ex: Monitor piscando, Falha na VPN...`).

---

## 📋 Perfis de Acesso (Roles)

* **Cliente:** Perfil voltado para funcionários da empresa que abrem chamados.
  * O quadro Kanban fica em modo leitura com um ícone de cadeado.
  * Pode abrir novos chamados.
  * Pode editar o status ou excluir **apenas os chamados criados por ele mesmo**.
* **Técnico de TI:** Perfil administrativo para a equipe de suporte.
  * Possui permissão completa de movimentação dos cartões via drag-and-drop.
  * Pode atribuir responsáveis aos chamados e atualizar o status de qualquer chamado.
  * Pode excluir chamados do quadro.

---

## 🛠️ Modelagem de Banco de Dados

O PostgreSQL cria automaticamente a seguinte modelagem na inicialização do serviço:

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
    USERS ||--o{ TICKETS : "abre"
    USERS ||--o{ TICKETS : "resolve"
```

---

## 🔌 Documentação da API REST

### 1. Autenticação (`/api/auth`)

#### Cadastro de Usuário
* **Rota:** `POST /api/auth/register`
* **JSON de Entrada:**
  ```json
  {
    "name": "João Silva",
    "email": "joao@empresa.com",
    "role": "client",
    "password": "senha_secreta"
  }
  ```
* **Status de Retorno:** `201 Created` ou `400 Bad Request`

#### Login
* **Rota:** `POST /api/auth/login`
* **JSON de Entrada:**
  ```json
  {
    "email": "joao@empresa.com",
    "password": "senha_secreta"
  }
  ```
* **Retorno:** Grava cookie seguro `token` com JWT e retorna `200 OK`.

#### Validar Sessão
* **Rota:** `GET /api/auth/me`
* **Retorno:** `200 OK` contendo os dados do usuário autenticado no cookie ou `401 Unauthorized` se a sessão for inválida.

---

### 2. Chamados (`/api/tickets`)

#### Criar Chamado
* **Rota:** `POST /api/tickets`
* **JSON de Entrada:**
  ```json
  {
    "title": "Falha na Rede Wi-Fi",
    "description": "O sinal cai constantemente na sala 4.",
    "priority": "high",
    "category": "network",
    "assigned_to": null
  }
  ```
* **Retorno:** `201 Created`

#### Listar Todos
* **Rota:** `GET /api/tickets`
* **Retorno:** `200 OK` contendo um array de chamados vinculando os nomes do criador e do técnico atribuído.

#### Atualizar Chamado
* **Rota:** `PUT /api/tickets/:id`
* **JSON de Entrada:** Todos os campos editáveis.
* **Retorno:** `200 OK`

#### Atualizar Status (Drag-and-Drop)
* **Rota:** `PATCH /api/tickets/:id/status`
* **JSON de Entrada:**
  ```json
  {
    "status": "in_progress"
  }
  ```
* **Retorno:** `200 OK`

---

## ⚙️ Como Rodar o Projeto

### Método 1: Usando Docker (Recomendado)
Certifique-se de que o **Docker Desktop** esteja ativo e rodando. Na pasta raiz do projeto, execute:

```bash
# Derruba volumes antigos (caso existam) e limpa cache
docker-compose down -v

# Compila a imagem Node e sobe os serviços
docker-compose up --build
```
Acesse no navegador: **[http://localhost:3000](http://localhost:3000)**.

---

### Método 2: Execução Local (Sem Docker)
Caso queira rodar o Node localmente conectado ao seu PostgreSQL do Windows:

1. **Configure o banco de dados:** No seu PostgreSQL local, crie um banco chamado `seu_chamado_db`.
2. **Configure as Variáveis de Ambiente:** Abra o arquivo `.env` na raiz e altere:
   ```env
   DB_HOST=localhost
   DB_USER=seu_usuario_postgres
   DB_PASSWORD=sua_senha_postgres
   DB_NAME=seu_chamado_db
   ```
3. **Instale as dependências:**
   ```bash
   npm install
   ```
4. **Inicie o servidor local:**
   ```bash
   # Inicia com watch automático (recarrega ao salvar arquivos)
   npm run dev
   ```
5. Acesse no navegador: **[http://localhost:3000](http://localhost:3000)**.
