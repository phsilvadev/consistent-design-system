export const stages = [
  {
    id: "ia",
    name: "Primeiro atendimento · IA",
    description: "Identificar o produto e entender a necessidade",
    color: "bg-violet-500",
    badge: "bg-violet-100 text-violet-700",
  },
  {
    id: "orcamento",
    name: "Em orçamento",
    description: "Conferir itens, quantidades e condições",
    color: "bg-blue-500",
    badge: "bg-blue-100 text-blue-700",
  },
  {
    id: "negociacao",
    name: "Negociação",
    description: "Acompanhar a proposta e o retorno do cliente",
    color: "bg-amber-500",
    badge: "bg-amber-100 text-amber-700",
  },
  {
    id: "vendedor",
    name: "Com vendedor",
    description: "Atendimento assumido pela equipe",
    color: "bg-orange-500",
    badge: "bg-orange-100 text-orange-700",
  },
  {
    id: "finalizado",
    name: "Finalizado",
    description: "Atendimentos concluídos",
    color: "bg-emerald-500",
    badge: "bg-emerald-100 text-emerald-700",
  },
] as const;
export type StageId = (typeof stages)[number]["id"];
export type Message = { author: "client" | "ai" | "human" | "system"; text: string; time: string };
export type Atendimento = {
  id: number;
  name: string;
  company: string;
  phone: string;
  stage: StageId;
  handler: "ai" | "human";
  owner: string;
  product: string;
  quantity: string;
  delivery: string;
  value: number;
  time: string;
  unread: number;
  messages: Message[];
};
export const initialAtendimentos: Atendimento[] = [
  {
    id: 1,
    name: "Carlos Mendes",
    company: "Construtora Vale",
    phone: "(11) 99999-0101",
    stage: "ia",
    handler: "ai",
    owner: "Assistente IA",
    product: "Metalon 30x30 · chapa 18",
    quantity: "20 barras de 6 m",
    delivery: "A confirmar",
    value: 0,
    time: "09:43",
    unread: 2,
    messages: [
      {
        author: "client",
        text: "Quero comprar metalon 30x30 chapa 18. Tem disponível?",
        time: "09:40",
      },
      {
        author: "ai",
        text: "Olá, Carlos! Vou consultar a disponibilidade e o preço no sistema de gestão. Você precisa de quantas barras de 6 metros?",
        time: "09:41",
      },
      { author: "client", text: "Preciso de 20 barras.", time: "09:42" },
      {
        author: "ai",
        text: "Certo: 20 barras de metalon 30x30, chapa 18, com 6 metros. Você deseja retirar na loja ou receber no endereço da obra?",
        time: "09:43",
      },
    ],
  },
  {
    id: 2,
    name: "Ana Oliveira",
    company: "AO Construções",
    phone: "(11) 99999-0104",
    stage: "ia",
    handler: "ai",
    owner: "Assistente IA",
    product: "Vergalhão CA-50 · 12 mm",
    quantity: "A confirmar",
    delivery: "Entrega na obra",
    value: 0,
    time: "09:38",
    unread: 1,
    messages: [
      {
        author: "client",
        text: "Bom dia! Preciso de vergalhão de 12 mm para uma obra. Vocês entregam?",
        time: "09:37",
      },
      {
        author: "ai",
        text: "Bom dia, Ana! Qual a quantidade de barras e o endereço da obra? Vou verificar a disponibilidade e as condições de entrega para você.",
        time: "09:38",
      },
    ],
  },
  {
    id: 3,
    name: "Juliana Ribeiro",
    company: "JR Obras",
    phone: "(11) 99999-0102",
    stage: "orcamento",
    handler: "ai",
    owner: "Assistente IA",
    product: "Metalon 30x30 · chapa 18",
    quantity: "20 barras de 6 m",
    delivery: "Retirada na loja",
    value: 1490,
    time: "09:35",
    unread: 0,
    messages: [
      {
        author: "client",
        text: "Preciso de 20 barras de metalon 30x30 chapa 18. Vou retirar na loja.",
        time: "09:32",
      },
      {
        author: "ai",
        text: "Entendido, Juliana. Separei os itens solicitados para a preparação do orçamento: 20 barras de 6 metros, com retirada na loja.",
        time: "09:35",
      },
    ],
  },
  {
    id: 4,
    name: "Marcos Silva",
    company: "M&S Estruturas",
    phone: "(11) 99999-0103",
    stage: "negociacao",
    handler: "ai",
    owner: "Assistente IA",
    product: "Chapa de aço · 3 mm",
    quantity: "10 chapas de 1,20 x 3 m",
    delivery: "Entrega na empresa",
    value: 4850,
    time: "09:28",
    unread: 1,
    messages: [
      {
        author: "ai",
        text: "Marcos, o orçamento das 10 chapas está organizado. Gostaria de confirmar a forma de pagamento e o endereço de entrega?",
        time: "09:25",
      },
      {
        author: "client",
        text: "Consegue uma condição melhor se eu pagar à vista?",
        time: "09:28",
      },
      {
        author: "ai",
        text: "Vou encaminhar a sua solicitação à equipe comercial para avaliar a condição de pagamento.",
        time: "09:28",
      },
    ],
  },
  {
    id: 5,
    name: "Rafael Costa",
    company: "Costa Engenharia",
    phone: "(11) 99999-0105",
    stage: "vendedor",
    handler: "human",
    owner: "Marina Silva",
    product: "Vergalhão CA-50 · 10 mm",
    quantity: "80 barras de 12 m",
    delivery: "Entrega na obra",
    value: 6240,
    time: "09:20",
    unread: 0,
    messages: [
      {
        author: "ai",
        text: "Rafael, registrei a sua necessidade: 80 barras de vergalhão CA-50 de 10 mm. Uma pessoa da equipe vai acompanhar as condições do seu pedido.",
        time: "09:15",
      },
      {
        author: "system",
        text: "Marina Silva assumiu o atendimento. A IA está pausada nesta conversa.",
        time: "09:18",
      },
      {
        author: "human",
        text: "Olá, Rafael! Sou a Marina. Vou ajudar a finalizar seu pedido e combinar a entrega.",
        time: "09:20",
      },
    ],
  },
  {
    id: 6,
    name: "Paulo Santos",
    company: "Serralheria Santos",
    phone: "(11) 99999-0106",
    stage: "finalizado",
    handler: "human",
    owner: "Marina Silva",
    product: "Cantoneira · 1” x 1/8”",
    quantity: "15 barras de 6 m",
    delivery: "Retirada na loja",
    value: 1260,
    time: "08:50",
    unread: 0,
    messages: [
      {
        author: "human",
        text: "Paulo, a retirada ficou combinada para hoje à tarde. Seu pedido está confirmado!",
        time: "08:48",
      },
      { author: "client", text: "Obrigado pelo atendimento! Até mais tarde.", time: "08:50" },
      { author: "system", text: "Atendimento finalizado por Marina Silva.", time: "08:50" },
    ],
  },
];
