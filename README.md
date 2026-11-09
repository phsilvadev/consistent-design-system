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

### Central manual — Fase 02
A rota Atendimentos consome a API real: criação manual com cliente identificado por telefone, funil com busca e filtro Meus atendimentos, alteração de status por seletor ou arraste, atribuição, painel de histórico, notas internas, encerramento e reabertura. Há skeleton, estado vazio, erros/retry e paginação. A abertura mantém `?atendimento=UUID` para recarregar o mesmo registro; o backend confere tenant/propriedade em cada consulta. Textos não são armazenados em localStorage e são renderizados escapados.

O canal é manual: a ação Registrar salva na central e não envia mensagens ao cliente. IA e WhatsApp permanecem nas fases seguintes. O protótipo local anterior está preservado em `src/components/atendimentos/demo/`, sem importação pelas rotas. Atualize o backend e aplique `alembic upgrade head`. A migration não cria conversas de exemplo. E2E: `e2e/conversations.spec.ts`, com FastAPI real e SQLite temporário; cobre criação, responsável, histórico após reload, fechamento/reabertura, busca, permissões, isolamento e mobile.

### Leitura e central atualizada automaticamente
Contadores e filtro Não lidos vêm do backend e pertencem ao usuário autenticado. Cada abertura acompanha o fim do histórico e confirma leitura apenas até o ID exibido. Ao consultar mensagens anteriores, o histórico não pula para o final e oferece Ir para os novos registros. A leitura de uma pessoa não limpa a de outra.

O hook `useVisiblePolling` sincroniza a cada 5 segundos somente com a aba visível e impede ciclos sobrepostos. A central preserva rascunhos, seleção e mensagens já carregadas; alterações de responsável/status de outra sessão chegam automaticamente. Se a transferência remover sua permissão, o painel limpa o conteúdo. Os tempos exibidos são de registro manual e períodos abertos, sem envio WhatsApp ou cálculo de SLA comercial. Aplicar a nova migration no backend antes de usar. Testes: `use-visible-polling.test.tsx` e `e2e/conversations-live.spec.ts` (duas sessões reais).

### Formato de exibição da conversa
A conversa abre em Modal por padrão. O seletor no cabeçalho, alinhado ao fechar, permite Tela cheia e Barra lateral sem reiniciar o histórico ou apagar o rascunho. A preferência fica neste navegador por usuário/empresa e é independente do editor de usuários. O componente DisplayModePicker é compartilhado com Configurações → Equipe. Nenhuma alteração no backend.

### Divisão cliente/plataforma para conhecimento
O WhatsApp operacional pertence a cada distribuidora, junto de sua integração ERP. A plataforma utiliza somente arquivos autorizados para curadoria do conhecimento comum. O backend passou a oferecer sessão de plataforma separada e APIs de importação JSON, revisão, versões e publicação. O frontend do superadministrador e o encaminhamento de suas rotas/cookie pelo BFF ainda não foram implementados; o login de cliente continua sem privilégios globais. A tela atual de Integrações permanece demonstrativa e não comprova uma conexão operacional. Consulte a documentação no repositório do backend.

## WhatsApp recebido na central

A central aceita `channel=whatsapp` e mensagens `whatsapp_inbound` autenticadas pelo webhook do backend, com identificação do cliente e leitura individual. A criação/reutilização do atendimento ocorre no backend. O composer permanece registro manual local; envio real, credenciais/tela de conexão Meta, mídias, status de entrega e IA continuam pendentes. Consulte o README/checklist do backend para configurar secrets e vínculo oficial do número.

## Integrações do cliente

A página Integrações consulta a API `/integrations/whatsapp-qr` pelo BFF e permite ao administrador iniciar o pareamento, acompanhar QR temporário/status e confirmar desconexão. O token do gateway e o ID da sessão são tratados exclusivamente no backend. Cada resposta é validada contra a empresa autenticada; falha remove o QR da tela. Conta sem serviço configurado exibe ativação pendente. GestãoClick/API e onboarding Meta simplificado continuam pendentes; não são exibidos como conectados. O transporte de saída ainda não foi implementado. Configure/inicie `whatsapp-bridge` no repositório backend; não há Docker obrigatório.

O teste opt-in `QR_GATEWAY_LIVE=1 npx playwright test e2e/qr-gateway-live.spec.ts` exige gateway real privado e variáveis do backend correspondentes. Ele gera QR e desconecta sem parear celular; não usa conta real nem valida recebimento real. Foi executado com sucesso nesta entrega. A suíte padrão não depende da rede WhatsApp.

A conexão WhatsApp abre em painel lateral esquerdo: antes do pareamento, apresenta instruções e QR temporário; quando conectada, o botão laranja **Configurar** reabre os detalhes da empresa, tipo, status, número e desconexão confirmada. Em mobile, o painel ocupa a largura disponível e mantém o rodapé acessível.

Os dois cards WhatsApp usam botão cinza **Conectar**, que abre o aside esquerdo. A ajuda **Como conectar** fica dentro de cada painel. O painel oficial possui 640px no desktop; no QR, a ação **Gerar QR Code** inicia o pareamento apenas após abrir os detalhes. Sem gateway configurado, os detalhes/ajuda continuam acessíveis e a geração fica desabilitada.

## Configuração manual oficial e segurança

O aside oficial agora possui Phone Number ID, WABA ID e token (campo password). **Validar e salvar** chama o backend; o token nunca é devolvido à interface, não entra em localStorage/sessionStorage e é limpo após envio/fechamento. Reabrir mostra somente que existe um token protegido; campo vazio reutiliza-o com os mesmos IDs.

Após salvar, o aside se expande de 640 para 960px e exibe o diagnóstico: aplicativo emissor, registro Cloud API, inscrição WABA e último recebimento. Ações Registrar na Cloud API (PIN transitório) e Ativar recebimento exigem confirmação e validação no backend. App ID/Secret, verify token e chave de criptografia são parâmetros da plataforma no servidor, nunca variáveis NEXT_PUBLIC. Consulte o README do backend para inicializar a chave em desenvolvimento e configurar o aplicativo/webhook na Meta. Sem configuração do aplicativo ou permissões suficientes, a ativação fica bloqueada. Não há cadastro incorporado/renovação automática ou envio de mensagens nesta etapa.

Validar token/número e inscrever WABA não comprovam que o webhook global/campo messages está configurado. O painel distingue essas etapas; conta e mensagens reais precisam de validação com credenciais autorizadas.

## Cadastro GestãoClick

Em Integrações → GestãoClick ERP, o admin abre um aside esquerdo e cadastra endereço base da API, Access Token e Secret Access Token. Respostas do backend não incluem os segredos; inputs password são limpos após envio/fechamento, sem localStorage/sessionStorage. Campos vazios mantêm o valor salvo quando a URL é a mesma. Trocar a URL exige ambos os tokens; remoção com confirmação apaga somente a configuração local. Status Credenciais cadastradas indica armazenamento, não validação de acesso/sincronização. Teste do fluxo real com SQLite temporário: `npx playwright test e2e/gestaoclick.spec.ts`.

### Prévia visual das próximas etapas GestãoClick

O link **Ver prévia das próximas etapas** no painel GestãoClick abre `/[tenant]/integracoes/previa-gestaoclick`. É uma demonstração isolada no frontend com credenciais cadastradas, teste de acesso, loja, permissões, sincronização e histórico. Botões simulam resultados em memória e não acessam APIs de integração ou ERP. A autenticação do workspace permanece existente. Nenhuma validação/sincronização real foi adicionada ao backend.

### GestãoClick — teste de acesso e loja implementados

O painel real agora oferece **Testar conexão** e **Salvar loja**, usando os tokens protegidos no backend. A consulta valida somente `GET /lojas` e sua permissão `Lojas/index`; não comprova acesso a produtos/clientes nem identifica o usuário efetivo da chave. Os vínculos fixos do usuário/loja no ERP podem prevalecer nas consultas futuras.

O status Acesso às lojas validado representa a última consulta. Troca de credenciais invalida lojas/seleção; falha de teste limpa dados anteriores e apresenta mensagem sem expor tokens. A API permite selecionar apenas loja da consulta autorizada recente. Nenhuma sincronização é iniciada. O link de prévia continua sendo uma demonstração local separada.

Teste ponta a ponta com API/SQL reais e somente transporte ERP simulado:

```sh
BACKEND_SOURCE_DIR=../Atend-hub-backend E2E_GESTAOCLICK_STUB=1 npm run test:e2e -- e2e/gestaoclick-access.spec.ts
```

O mock existe apenas no runner de testes com SQLite temporário; não é um modo da aplicação de produção. OpenAPI recebido e decisões estão documentados em docs/GESTAOCLICK_ACCESS.md no backend.

### Catálogo integrado ao GestãoClick
Integrações → GestãoClick permite sincronizar produtos da loja salva. O painel consulta o backend real, informa progresso/último sucesso e permite continuar após sair da tela. Produtos utiliza catálogo persistido, busca/paginação e skeleton; não exibe mais amostras fixas. Preços/estoque/unidades ficam para próxima etapa. Testes HTTP do provedor são isolados; não há flag de simulação no backend de produção.

E2E de importação e prints (API real/SQLite temporário + ERP HTTP simulado):
```bash
E2E_GESTAOCLICK_STUB=1 PLAYWRIGHT_CHROMIUM_EXECUTABLE=/usr/bin/chromium npm run test:e2e -- e2e/gestaoclick-products.spec.ts
```

### Imagem própria do produto
Administradores podem usar **Adicionar imagem** ou **Trocar imagem** no catálogo. Modal com arrastar/soltar, seleção, prévia e envio (JPG/PNG/WebP até 5 MiB), com estados de erro/processamento/sucesso. Miniaturas são lidas por sessão da empresa. A rota binária dedicada mantém o BFF JSON e os limites existentes; nenhuma chave Firebase é necessária no Next. Configure o bucket/identidade somente no backend conforme a documentação de Firebase daquele repositório.

E2E de imagens e prints, sem acessar Firebase real:
```bash
BACKEND_SOURCE_DIR=../Atend-hub-backend E2E_GESTAOCLICK_STUB=1 E2E_FIREBASE_STORAGE_STUB=1 npm run test:e2e -- e2e/product-images.spec.ts
```
A simulação existe somente no runner isolado com SQLite temporário. A API e a validação/reencodificação de arquivos são reais; o SDK Storage é simulado. A imagem de teste em `e2e/fixtures/product-tube.png` é uma ilustração fictícia gerada para validar o fluxo.

Para validar o Firebase real com dados temporários (faz upload e remove a imagem de teste ao terminar):
```bash
BACKEND_SOURCE_DIR=../Atend-hub-backend E2E_GESTAOCLICK_STUB=1 E2E_FIREBASE_REAL=1 npm run test:e2e -- e2e/product-images.spec.ts
```
Requer bucket/identidade configurados no backend. Não combinar com `E2E_FIREBASE_STORAGE_STUB`. Somente o ERP permanece simulado; Storage, validação de imagem, sessões e banco são reais. O helper restringe verificação/limpeza à empresa no SQLite temporário, verifica negação de leitura anônima e não exibe credenciais.

### Verificação antirrobô
Os formulários públicos de autenticação usam Cloudflare Turnstile; a API valida o token antes de criar sessões/empresas. A configuração pública é carregada em runtime pelo BFF; nenhuma chave secreta fica neste frontend. Tokens expiram e são renovados após cada tentativa. Falha de script/configuração não libera envio. O backend possui instruções completas em `docs/ANTIBOT.md`; modo de teste local não deve ser publicado.

Teste de navegador com widget/Siteverify oficiais e chaves públicas de teste:
```bash
BACKEND_SOURCE_DIR=../Atend-hub-backend E2E_TURNSTILE_TEST=1 npm run test:e2e -- e2e/turnstile.spec.ts
```
Produção no Railway depende de chaves reais, hostnames, HTTPS/APP_ORIGIN e backend PostgreSQL validados.

Publicado em https://cliente-production-a80d.up.railway.app/login. Deploy direto pelo CLI autenticado na conta com créditos; atualizar com railway up apontando explicitamente projeto/ambiente/serviço. Instruções/IDs em docs/RAILWAY.md do backend. Autodeploy GitHub ainda não vinculado. Turnstile de produção exige confirmação humana.

### Ajuda e suporte

Acesse o item no rodapé do menu lateral ou no menu do perfil. A rota autenticada `/{empresa}/ajuda` oferece busca sem acentos, categorias e perguntas frequentes. O botão da página abre o mesmo chat flutuante disponível no painel. Nesta entrega o chat responde com exemplos locais, claramente identificados; não há integração OpenAI ou abertura de chamado humano. A faixa secundária de empresa/dados demonstrativos foi removida; trial e menu da conta permanecem.

O painel WhatsApp oficial inclui Conectar com a Meta (Cadastro Incorporado) e alternativa manual recolhida. O backend precisa de configuração real de App ID/App Secret/Config ID; consulte `docs/WHATSAPP_EMBEDDED_SIGNUP.md` no repositório backend. Nunca configurar App Secret em variáveis públicas Next.

### Acesso do cliente

Login e cadastro usam uma moldura arredondada com painel visual e preservam a paleta atual. O login oferece o link `/esqueci-senha` e a página `/redefinir-senha` trata o token de recuperação somente em memória. Google Identity Services é usado para login/cadastro; sem `GOOGLE_AUTH_CLIENT_ID` no backend, a interface informa que a configuração está pendente. Recuperação requer origem pública e SMTP STARTTLS configurados no backend. Os campos e a verificação Turnstile do acesso por e-mail permanecem.

Credenciais de Google/SMTP, regras de vínculo e segurança estão em `docs/CLIENT_AUTH.md` do repositório backend. A etapa local usa SDK Google/SMTP simulados apenas nos testes; uso com conta Google real e entrega real de e-mail ainda precisam de configuração e validação.

As telas públicas de acesso ocupam toda a janela, sem fundo externo escuro, padding externo ou limite de largura. Publicado com cliente 20f74147-d5b1-4e44-a2db-9badcaa650b9 e API 818ef177-a268-4964-aab4-75e14f658502 (SUCCESS). Google/recuperação aguardam Client ID e SMTP reais; Turnstile de produção preservado.
