import { Router, type IRouter, type Request } from "express";
import { ReplitConnectors } from "@replit/connectors-sdk";
import {
  CreateCheckoutSessionBody,
  CreateCheckoutSessionResponse,
  ListProductsResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();
const connectors = new ReplitConnectors();

const products = [
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
] as const;

router.get("/products", (_req, res) => {
  res.json(ListProductsResponse.parse(products));
});

router.post("/checkout-session", async (req, res) => {
  const parsed = CreateCheckoutSessionBody.safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({ error: "بيانات السلة غير صالحة." });
    return;
  }

  const requestedItems = parsed.data.items.map((item) => {
    const product = products.find((candidate) => candidate.id === item.productId);
    return { ...item, product };
  });

  if (requestedItems.some((item) => !item.product)) {
    res.status(400).json({ error: "يتضمن الطلب عطرًا غير متاح." });
    return;
  }

  const origin = getRequestOrigin(req);
  const lineItems = requestedItems.map(({ product, quantity }) => ({
    price_data: {
      currency: product!.currency,
      unit_amount: product!.price,
      product_data: {
        name: product!.name,
        description: product!.description,
        images: [product!.image],
      },
    },
    quantity,
  }));

  try {
    const response = await connectors.proxy("stripe", "/v1/checkout/sessions", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: toFormEncoded({
        mode: "payment",
        success_url: `${origin}/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${origin}/cancel`,
        "shipping_address_collection[allowed_countries][0]": "KW",
        "shipping_address_collection[allowed_countries][1]": "SA",
        "shipping_address_collection[allowed_countries][2]": "AE",
        "line_items": lineItems,
      }),
    });

    const payload = (await response.json()) as { url?: string; error?: { message?: string } };
    if (!response.ok || !payload.url) {
      req.log.error({ status: response.status }, "Stripe Checkout session failed");
      res.status(500).json({ error: payload.error?.message ?? "تعذر بدء الدفع." });
      return;
    }

    res.json(CreateCheckoutSessionResponse.parse({ url: payload.url }));
  } catch (error) {
    req.log.error({ err: error }, "Stripe Checkout request failed");
    res.status(500).json({ error: "تعذر الاتصال بخدمة الدفع. حاول مرة أخرى." });
  }
});

function getRequestOrigin(req: Request) {
  const forwardedProto = req.headers["x-forwarded-proto"];
  const protocol = Array.isArray(forwardedProto)
    ? forwardedProto[0]
    : forwardedProto?.split(",")[0] ?? req.protocol;
  const forwardedHost = req.headers["x-forwarded-host"];
  const host = Array.isArray(forwardedHost)
    ? forwardedHost[0]
    : forwardedHost?.split(",")[0] ?? req.get("host");

  if (!host) {
    throw new Error("Request host is unavailable");
  }

  return `${protocol}://${host}`;
}

function toFormEncoded(values: Record<string, unknown>) {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(values)) {
    if (key === "line_items" && Array.isArray(value)) {
      value.forEach((lineItem, index) => {
        const item = lineItem as {
          price_data: {
            currency: string;
            unit_amount: number;
            product_data: { name: string; description: string; images: string[] };
          };
          quantity: number;
        };
        params.set(`line_items[${index}][quantity]`, String(item.quantity));
        params.set(`line_items[${index}][price_data][currency]`, item.price_data.currency);
        params.set(`line_items[${index}][price_data][unit_amount]`, String(item.price_data.unit_amount));
        params.set(`line_items[${index}][price_data][product_data][name]`, item.price_data.product_data.name);
        params.set(
          `line_items[${index}][price_data][product_data][description]`,
          item.price_data.product_data.description,
        );
        item.price_data.product_data.images.forEach((image, imageIndex) => {
          params.set(
            `line_items[${index}][price_data][product_data][images][${imageIndex}]`,
            image,
          );
        });
      });
      continue;
    }

    params.set(key, String(value));
  }

  return params.toString();
}

export default router;