export type CatalogProduct = {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  notes: string;
};

export const catalog: CatalogProduct[] = [
  {
    id: "oud-noir",
    name: "عود نوير",
    description: "عود دافئ بلمسة جلدية عميقة، مصاغ لأمسيات لا تُنسى.",
    price: 18500,
    currency: "aed",
    notes: "عود • زعفران • جلد",
  },
  {
    id: "amber-veil",
    name: "حجاب العنبر",
    description: "عنبر ذهبي ناعم يلتقي بالفانيلا وخشب الصندل.",
    price: 16000,
    currency: "aed",
    notes: "عنبر • فانيلا • صندل",
  },
  {
    id: "rose-majlis",
    name: "ورد المجلس",
    description: "ورد طائفي مخملي مع لمسة بخور ناعمة وحضور أنيق.",
    price: 14500,
    currency: "aed",
    notes: "ورد • بخور • مسك",
  },
  {
    id: "musk-sahar",
    name: "مسك السَحَر",
    description: "مسك أبيض نظيف، هادئ ومشرق للاستخدام اليومي.",
    price: 12500,
    currency: "aed",
    notes: "مسك أبيض • زهر البرتقال",
  },
  {
    id: "incense-ritual",
    name: "طقس البخور",
    description: "مزيج بخوري غني يترك أثرًا دافئًا ومتزنًا في المكان.",
    price: 17500,
    currency: "aed",
    notes: "بخور • أخشاب • توابل",
  },
  {
    id: "sandal-dune",
    name: "كثيب الصندل",
    description: "صندل كريمي بنفحات زعفران وعنبر، بطابع عربي معاصر.",
    price: 15500,
    currency: "aed",
    notes: "صندل • زعفران • عنبر",
  },
];