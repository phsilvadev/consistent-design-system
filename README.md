# AtendeHUB

Frontend Next.js 16 (App Router), TypeScript, React e Tailwind CSS. A branch **development** inicia a integração com o backend FastAPI: cadastro, login, sessão, logout e autorização por empresa são reais. As telas comerciais continuam demonstrativas, sem integração com WhatsApp, IA ou ERP nesta etapa.

## Desenvolvimento

Requer Node.js 22+, npm e o backend separado em [phsilvadev/Atend-hub-backend](https://github.com/phsilvadev/Atend-hub-backend).

No repositório do backend, siga seu README para criar a `.venv`, instalar `requirements.txt`, configurar SQLite e executar `alembic upgrade head`. Inicie a API, sem Docker:

```sh
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

Neste repositório:

```sh
npm ci
cp .env.example .env
npm run dev
```

Abra **http://localhost:3000/cadastro** para criar empresa, administrador e trial de 7 dias. Ou use `/login` para entrar numa conta existente. Não existem usuários padrão.

Variáveis privadas do servidor Next:

```dotenv
BACKEND_URL=http://127.0.0.1:8000
APP_ORIGIN=http://localhost:3000
```

`BACKEND_URL` nunca deve usar prefixo NEXT_PUBLIC. `APP_ORIGIN` precisa corresponder exatamente à origem do navegador, também presente no `ALLOWED_ORIGINS` do backend. Para usar `127.0.0.1`, portas diferentes ou HTTPS, ajuste ambos. Produção exige HTTPS, cookie Secure e configuração de banco/infraestrutura no backend.

## Rotas e isolamento de empresas

A raiz `/` leva à empresa autenticada ou ao login. Rotas privadas usam **o UUID real da empresa devolvido pelo backend**, por exemplo `/<company.id>/atendimentos`. A API atual vincula cada usuário a uma empresa e ainda não oferece slug personalizado ou múltiplos vínculos.

- `/<company.id>` — dashboard.
- `/<company.id>/atendimentos`, `/orcamentos`, `/clientes`, `/produtos`, `/relatorios`.
- `/<company.id>/configuracoes`, `/integracoes`, `/empresas`.
- `/login`, `/cadastro` — públicos.
- `/:tenant/login` e `/:tenant/cadastro` — aliases antigos, redirecionados às telas públicas.

Digitar qualquer nome/ID na URL não concede acesso. O nome e o usuário exibidos vêm da sessão da API. “Minha empresa” apresenta somente a empresa vinculada, sem opções fictícias de troca.

### Middleware no Next.js 16

No Next 16, o middleware se chama **`src/proxy.ts`**. Ele consulta `/api/v1/auth/me` e compara o tenant da URL com `company.id` e `user.company_id` retornados. Não basta existir um cookie. Tentativa de outra empresa recebe **403**, sem renderizar o workspace; indisponibilidade da API falha fechada, com **503**.

O layout servidor repete a verificação de sessão e vínculo, independentemente do proxy. Trial vencido não renderiza conteúdo comercial. O guard cliente aguarda revalidação antes de mostrar o workspace e verifica novamente ao focar a janela e a cada minuto, retirando conteúdo após revogação/troca de conta.

A API Python continua responsável pela autorização final e por filtrar os dados por empresa. Middleware não substitui essas regras. Cada função futura que leia dados no servidor deve manter autorização no ponto de acesso, não apenas no layout.

## Autenticação e proxy da API

O navegador chama `/api/v1/*` na mesma origem; o Route Handler do Next encaminha apenas os endpoints/métodos conhecidos à API. Cookies opacos HttpOnly/SameSite são preservados, não há tokens em JSON/localStorage. Logout revoga a sessão no backend. Origin/Referer são verificados nas mutações, sem CORS amplo, e respostas privadas não têm cache.

Endpoints usados: `POST /auth/register`, `POST /auth/login`, `GET /auth/me`, `POST /auth/logout`; os caminhos sob `/users` já existentes são encaminhados e autorizados pelo backend. Payloads de mutação são limitados a 16 KiB. Não envie company_id ou perfis no cadastro público.

## Verificar

```sh
npm run lint
npm test
npm run typecheck
npm run build
npm start
```

Os testes existentes de aparência e atendimento foram preservados. Foram acrescentados testes para sessão, proxy, layout servidor e revalidação do cliente.

### Ponta a ponta com FastAPI e SQLite reais

Instale o backend separado e suas dependências na `.venv`. Depois:

```sh
npx playwright install chromium
npm run build
BACKEND_SOURCE_DIR=../Atend-hub-backend npm run test:e2e
```

O script inicia Next na porta 3200 e FastAPI na 8200, cria SQLite temporário via migrations e não altera o banco de desenvolvimento. As portas devem estar livres. `BACKEND_SOURCE_DIR` pode ser absoluto. Se Chromium já estiver instalado:

```sh
BACKEND_SOURCE_DIR=../Atend-hub-backend PLAYWRIGHT_CHROMIUM_EXECUTABLE=/usr/bin/chromium npm run test:e2e
```

Os testes cobrem cadastro/login/logout, cookies, duas empresas independentes, todas as telas de outro tenant, RSC/prefetch, falsificação/replay de cookie, trial vencido, usuário inativo, CSRF e aliases públicos. Capturas ficam em `test-results/`, ignorado pelo Git.

## Interface preservada e limites

A aparência mantém Normal, Clean e Personalizado, com preferências no navegador separadas pelos IDs reais de empresa e usuário. O funil de atendimento, gráficos, produtos e relatórios ainda usam exemplos; os dados não representam empresas reais. Mensagens e novos atendimentos são apenas estado de interface. Login/cadastro deixaram de ser demonstrações.

Não há recuperação de senha por e-mail, múltiplos vínculos de empresa, slugs personalizados ou integração de dados comerciais nesta etapa. Consulte [ARCHITECTURE.md](ARCHITECTURE.md) e [CHECKLIST.md](CHECKLIST.md).

## Histórico Lovable

Projeto conectado ao [Lovable](https://lovable.dev/projects/002d9028-b2bf-458a-baf0-0052d8e3a3f2). As alterações desta entrega permanecem na branch development; não reescreva histórico publicado nem force push.

## Configurações → Equipe

Equipe é a primeira aba e abre por padrão, antes de Aparência. Para administradores, o selo ao lado do nome mostra o total real retornado por `GET /api/v1/users`, incluindo usuários ativos e inativos. O total é atualizado ao carregar, atualizar a lista e cadastrar um usuário. Enquanto a quantidade não está disponível, mostra-se `—`, sem assumir zero.

A listagem apresenta nome, e-mail, perfil e status da própria empresa. “Adicionar usuário” usa `POST /api/v1/users`, sem incluir company_id no corpo; o backend obtém a empresa da sessão. A senha inicial não é salva no navegador nem devolvida na lista, e nenhum convite por e-mail é enviado.

Vendedores, supervisores e operadores recebem uma mensagem de acesso restrito à administração da equipe. Aparência continua disponível como preferência pessoal. Edição de perfil e desativação de usuários não foram implementadas nesta etapa.

Validação adicional: 71 testes Vitest aprovados e 6 E2E com FastAPI/SQLite reais, cobrindo contagem após cadastro/reload, troca entre abas, permissões e layout mobile. O backend não precisou ser alterado.

### Edição de usuários
Em Configurações → Equipe, a ação Editar permite alterar nome, e-mail, perfil e ativação por meio do backend autenticado. O formulário abre em modal por padrão e oferece Tela cheia e Barra lateral pelo seletor no cabeçalho. A preferência fica neste navegador e os campos são preservados ao alternar. Mudanças de permissões/e-mail/ativação encerram as sessões do usuário editado. A API deve oferecer `PATCH /api/v1/users/{user_id}` conforme documentado no backend.

### Configurações da empresa
Em Configurações → Empresa, membros consultam os dados cadastrais; administradores editam nome fantasia, razão social, CNPJ, contato, endereço e horários semanais com fuso. A aba usa GET/PATCH `/api/v1/company/settings` da API autenticada, confirma o vínculo da empresa retornada e não envia company_id no formulário. Inclui carregamento, tentativa novamente, descarte de alterações, validação e confirmação em modal com fundo desfocado. Atualize o backend e execute `alembic upgrade head` antes de usar. Os horários ficam apenas cadastrados; não ativam atendimento automático. Teste integrado: `e2e/company-settings.spec.ts`, com backend real e SQLite temporário, sem Docker.

### Planos e assinatura
A aba Configurações → Planos consome `GET /api/v1/company/subscription`: plano atual, trial, usuários e catálogo de upgrade. Nomes, valores, limites e recursos vêm do banco da API; o frontend não mantém planos de fallback. Preparar o backend com `alembic upgrade head` e `python -m app.seeds.plans` em desenvolvimento. O catálogo fictício está identificado na interface. Inclui skeleton, retry, catálogo vazio, indicação do plano atual e detalhes informativos. Contratação, cobrança, quotas e entitlements reais continuam pendentes. E2E: `e2e/plan-settings.spec.ts` usa SQLite temporário e seed real, sem Docker.

### Checklist mestre
O [CHECKLIST.md](CHECKLIST.md) foi ampliado para os 14 módulos do [prompt mestre](docs/PROMPT_MESTRE.md), incluindo fases futuras, bloqueios e evidências. O [histórico anterior](docs/DEVELOPMENT_HISTORY.md) foi preservado. Os dois repositórios mantêm o mesmo roadmap mestre; itens de fases futuras permanecem pendentes, mesmo que existam telas demonstrativas.
