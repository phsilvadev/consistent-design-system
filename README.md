# AtendeHUB

Interface em Next.js (App Router), TypeScript, React e Tailwind CSS, com dados fixos no código das telas. Não usa banco de dados, autenticação, sessão ou APIs externas.

## Executar

Node.js 22+ e npm:

```sh
npm ci
npm run dev
```

A raiz abre `/empresa-exemplo`. Qualquer identificador de empresa pode ser usado diretamente na URL, sem cadastro ou login:

- `/qualquer-empresa`
- `/qualquer-empresa/atendimentos`
- `/qualquer-empresa/orcamentos`
- `/qualquer-empresa/clientes`
- `/qualquer-empresa/produtos`
- `/qualquer-empresa/relatorios`
- `/qualquer-empresa/configuracoes`
- `/qualquer-empresa/integracoes`
- `/qualquer-empresa/empresas`
- `/qualquer-empresa/login`
- `/qualquer-empresa/cadastro`

Todas as rotas estão em `src/app/[tenant]/(workspace)`. O identificador serve apenas para navegar e apresentar o nome da empresa. Os dados das telas são fixos e iguais em todos os ambientes; não há isolamento de dados reais nesta versão.

Login e cadastro são telas de interface: seus formulários apenas abrem o painel, sem verificar ou armazenar credenciais e sem criar contas. Conversas usam estado local para visualizar mensagens e interações; ao recarregar a página, os dados iniciais voltam. As preferências de aparência ficam no navegador. Em Configurações → Aparência, os cards Normal, Clean e Personalizado ficam lado a lado. Personalizado oferece cores da página, cards, cabeçalho, textos, menu, botões, bordas e gráficos; ajuste automático das cores dos textos; fonte, tamanho e peso dos títulos; espaçamento; largura do menu; cabeçalho fixo; cantos, bordas e sombras; animações; combinações prontas; importação/exportação de temas e restauração do padrão. Os temas também são aplicados aos diálogos e chats laterais; o conteúdo e a organização do dashboard permanecem no layout original.

## Funil de atendimento

A tela de atendimentos organiza os cards em cinco etapas: Primeiro atendimento com IA, Em orçamento, Negociação, Com vendedor e Finalizado. Os exemplos mostram a IA identificando produto, quantidade e recebimento antes do acompanhamento comercial.

É possível arrastar cards, pesquisar clientes e produtos, filtrar por responsável e abrir o chat lateral com o histórico. Assumir o atendimento move o card para a equipe e pausa a IA na interface; devolver à IA retorna à primeira etapa. O seletor no chat permite mover etapas também sem arrastar. Atendimentos finalizados precisam ser reabertos para responder. Novos atendimentos e mensagens existem apenas no estado local: não há conexão com IA, WhatsApp ou ERP.

## Verificar e gerar build

```sh
npm run lint
npm test
npm run typecheck
npm run build
npm start
```

O projeto usa Webpack para desenvolvimento e build. Não é necessário configurar variáveis de banco ou executar migrações. A hospedagem deve suportar Next.js/Node.js.

O projeto está conectado ao [Lovable](https://lovable.dev/projects/002d9028-b2bf-458a-baf0-0052d8e3a3f2). Não reescreva o histórico Git publicado.
