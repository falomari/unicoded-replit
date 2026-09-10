export type CatalogProduct = {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  image: string;
  notes: string;
};

export const catalog: CatalogProduct[] = [
  {
    id: "oud-noir",
    name: "عود نوير",
    description: "عود دافئ بلمسة جلدية عميقة، مصاغ لأمسيات لا تُنسى.",
    price: 18500,
    currency: "aed",
    image:
      "https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&w=900&q=85",
    notes: "عود • زعفران • جلد",
  },
  {
    id: "amber-veil",
    name: "حجاب العنبر",
    description: "عنبر ذهبي ناعم يلتقي بالفانيلا وخشب الصندل.",
    price: 16000,
    currency: "aed",
    image:
      "https://images.unsplash.com/photo-1547887538-e3a2f32cb1cc?auto=format&fit=crop&w=900&q=85",
    notes: "عنبر • فانيلا • صندل",
  },
  {
    id: "rose-majlis",
    name: "ورد المجلس",
    description: "ورد طائفي مخملي مع لمسة بخور ناعمة وحضور أنيق.",
    price: 14500,
    currency: "aed",
    image:
      "https://images.unsplash.com/photo-1563170351-be82bc888aa4?auto=format&fit=crop&w=900&q=85",
    notes: "ورد • بخور • مسك",
  },
  {
    id: "musk-sahar",
    name: "مسك السَحَر",
    description: "مسك أبيض نظيف، هادئ ومشرق للاستخدام اليومي.",
    price: 12500,
    currency: "aed",
    image:
      "https://images.unsplash.com/photo-1588405748880-12d1d2a59f75?auto=format&fit=crop&w=900&q=85",
    notes: "مسك أبيض • زهر البرتقال",
  },
  {
    id: "incense-ritual",
    name: "طقس البخور",
    description: "مزيج بخوري غني يترك أثرًا دافئًا ومتزنًا في المكان.",
    price: 17500,
    currency: "aed",
    image:
      "https://images.unsplash.com/photo-1615634260167-c8cdede054de?auto=format&fit=crop&w=900&q=85",
    notes: "بخور • أخشاب • توابل",
  },
  {
    id: "sandal-dune",
    name: "كثيب الصندل",
    description: "صندل كريمي بنفحات زعفران وعنبر، بطابع عربي معاصر.",
    price: 15500,
    currency: "aed",
    image:
      "https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&w=900&q=85",
    notes: "صندل • زعفران • عنبر",
  },
];