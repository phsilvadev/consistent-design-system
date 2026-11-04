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
