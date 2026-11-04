# Integração de autenticação e autorização por empresa

Frontend Next 16 App Router, React 19, Tailwind, componentes existentes preservados. Backend FastAPI independente, sessões opacas HttpOnly e empresa obtida da sessão.

Navegador → /api/v1/* no Next (Route Handler, mesma origem) → FastAPI. BACKEND_URL é privado ao servidor. Não armazenar token em localStorage nem incluir company_id confiando no navegador.

Next 16 chama seu middleware de proxy: src/proxy.ts. Ele valida a sessão na API e compara o segmento da URL com company.id retornado por /auth/me; company.id também precisa coincidir com user.company_id. Tenant divergente recebe 403 sem conteúdo do workspace. Falha da API bloqueia acesso. Ausência/expiração de sessão redireciona para /login.

O layout servidor protegido repete a autorização antes de renderizar o workspace, mesmo se o proxy for contornado. O provider cliente revalida ao focar a janela e periodicamente para retirar conteúdo após revogação ou troca de conta. A API continua responsável por autorização final e filtros por tenant nas operações.

Rotas públicas de login/cadastro saem do grupo protegido. / redireciona à empresa real da sessão ou login. UUID é o identificador canônico nesta fase: o backend não tem slug nem memberships múltiplos. Aparência continua local, segregada pelos IDs reais de empresa e usuário.

Cookie encaminhado ao backend com cache desativado; respostas privadas sem cache. Mutações validam Origin/Referer tanto no proxy de API quanto no backend; a origem do frontend deve estar em ALLOWED_ORIGINS. API proxy usa somente caminhos e métodos conhecidos, preserva Set-Cookie e não segue redirecionamentos externos. Produção exige HTTPS, COOKIE_SECURE e APP_ORIGIN configurados.

Trial vencido mantém me/logout e exibe tela de expiração, sem renderizar conteúdo comercial. As telas comerciais ainda demonstrativas serão identificadas como tal; não são dados reais de outras empresas.

Não há alteração de schema do backend nesta etapa. O frontend obtém identidade exclusivamente do contrato existente e faz comparação exata de ID, sem deduzir vínculo pelo nome da empresa.
