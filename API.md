# Contrato de integração inicial

Backend: repositório independente Atend-hub-backend. Base no navegador: `/api/v1` (proxy Next). Base privada configurada por BACKEND_URL. Não há endpoints de ERP/IA inventados.

| Método | Endpoint | Uso |
|---|---|---|
| POST | /auth/register | name, company, email, password; cria empresa/admin/trial e cookie |
| POST | /auth/login | email, password, remember; valida credenciais e cria cookie |
| GET | /auth/me | identidade real da sessão e estado do trial |
| POST | /auth/logout | revoga sessão e limpa cookie |
| GET | /users | lista da própria empresa, somente admin |
| POST | /users | name, email, password, role; somente admin da própria empresa |
| GET | /users/{id} | usuário da própria empresa, somente admin |

Resposta de identidade: user (id, company_id, name, email, role, active), company (id, name, plan, trial_started_at, trial_ends_at), trial_expired. IDs são UUIDs e datas são segundos Unix UTC.

Perfis: admin, supervisor, seller, operator. O frontend nunca assume vínculo pelo nome, papel ou ID informado em cabeçalhos/parâmetros. A URL canônica exige igualdade exata entre seu primeiro segmento, company.id e user.company_id da sessão. Múltiplos vínculos ainda não existem na API.

Mutação exige Origin ou Referer correspondente ao APP_ORIGIN, que também precisa estar no ALLOWED_ORIGINS do backend. Corpo máximo: 16 KiB. Cookie HttpOnly encaminhado sem expor seu valor ao cliente. Não há token em localStorage e não se seguem redirects do upstream.

401: sessão/credenciais inválidas. 403: origem/permissão/trial/tenant divergente. 404: recurso inexistente ou fora da empresa. 409: e-mail indisponível. 422: entrada inválida. 429: limite de tentativas no backend. 503: API indisponível. Senhas não são ecoadas nos erros.

O proxy de navegação responde diretamente com documento estático 403/503, sem dados do workspace; evita que rewrites do App Router convertam uma negação em HTTP 200. O layout servidor usa a interrupção forbidden como defesa adicional.
