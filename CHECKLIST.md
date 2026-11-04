# Integração inicial com backend

Branch: development. Preservar o visual e o histórico do frontend Lovable; não alterar main nem usar force push. Backend separado em phsilvadev/Atend-hub-backend. Sem Docker.

- [x] Inspecionar rotas, contexto, formulários e contratos do backend.
- [x] Cliente de autenticação e proxy de API de mesma origem.
- [x] Login e cadastro reais usando cookie HttpOnly; logout revogável.
- [x] Proteção por sessão e vínculo à empresa no proxy (middleware do Next 16).
- [x] Revalidar autorização no layout servidor e contexto do cliente.
- [x] Usar empresa/usuário reais; remover seletor de empresas fictícias.
- [x] Testar ausência de sessão, token forjado, sessão revogada, tenant diferente, trial e API indisponível.
- [x] Validar testes existentes, tipos, lint e build; gerar prints.
- [x] Documentar configuração.
- [x] Publicar branch development.

## Limites
- O backend vincula cada usuário a uma empresa. A URL canônica usa company.id (UUID); nomes/slugs não autorizam acesso. Múltiplos vínculos e slugs personalizados exigem contrato no backend em outra fase.
- IA/ERP/WhatsApp e dados comerciais continuam fora desta etapa.
- Login/cadastro públicos serão /login e /cadastro. Os endereços antigos /:tenant/login e /:tenant/cadastro serão redirecionados para essas telas.

## Evidências de validação
- 64 testes Vitest aprovados, incluindo testes já existentes da interface e novas verificações do proxy, layout e cliente.
- 5 cenários Playwright aprovados com FastAPI real e SQLite temporário: formulários, duas empresas isoladas, 9 páginas de outro tenant, RSC/prefetch, tokens forjados/revogados, conta desativada, trial vencido e CSRF.
- 20 testes Pytest do backend separado aprovados; não foi necessário alterar seu código.
- Lint, typecheck, build e diff --check aprovados. Capturas desktop/mobile em test-results (não versionadas).
- Nenhum Docker executado; nenhuma credencial externa requerida; main preservada.

## Próxima etapa
Configurar ambiente de implantação compatível com Next + FastAPI. Para nomes personalizados na URL ou múltiplas empresas por usuário, primeiro acrescentar contrato e persistência de vínculos no backend, com migrations e testes próprios.

Publicação confirmada no GitHub: origin/development. Commit de implementação: 941a4f2. Main não foi alterada.

## Configurações — Equipe (escopo adicional autorizado)
- [x] Colocar Equipe como primeira aba, antes de Aparência, com total real de usuários.
- [x] Listar e cadastrar usuários com a API existente, sem enviar empresa no payload.
- [x] Restringir administração da equipe a administradores e tratar falhas de acesso.
- [x] Validar contagem, criação, isolamento, preservação de Aparência e gerar print.

Validação de Equipe: 71 testes Vitest e 6 cenários E2E aprovados, além de lint, typecheck, build e diff --check. Capturas desktop/mobile geradas usando dados exclusivamente de teste. Nenhuma alteração na API Python ou na branch main.

## Confirmação de cadastro de usuário
- [x] Substituir aviso inline por modal de sucesso com fundo desfocado, após confirmação da API.
- [x] Preservar erros no formulário, atualização do contador e navegação acessível.
- [x] Validar e capturar modal de cadastro e modal de sucesso em desktop.

Validação: build e lint aprovados; E2E de Equipe aprovado com erro de e-mail duplicado, cadastro real, contador, blur e restauração do foco. Prints desktop dos dois modais gerados. Backend sem alterações.
