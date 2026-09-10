import { catalog } from "./_catalog";

type RequestLike = {
  method?: string;
  body?: unknown;
  headers: Record<string, string | string[] | undefined>;
};

type ResponseLike = {
  status: (code: number) => ResponseLike;
  json: (body: unknown) => void;
};

type CheckoutBody = {
  items?: Array<{ productId?: unknown; quantity?: unknown }>;
};

export default async function handler(req: RequestLike, res: ResponseLike) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "الطريقة غير مدعومة." });
    return;
  }

  const body = (req.body ?? {}) as CheckoutBody;
  const items = body.items;
  if (
    !Array.isArray(items) ||
    items.length === 0 ||
    items.length > 20 ||
    items.some(
      (item) =>
        typeof item.productId !== "string" ||
        typeof item.quantity !== "number" ||
        !Number.isInteger(item.quantity) ||
        item.quantity < 1 ||
        item.quantity > 10,
    )
  ) {
    res.status(400).json({ error: "بيانات السلة غير صالحة." });
    return;
  }

  const resolvedItems = items.map((item) => ({
    ...item,
    product: catalog.find((candidate) => candidate.id === item.productId),
  }));
  if (resolvedItems.some((item) => !item.product)) {
    res.status(400).json({ error: "يتضمن الطلب عطرًا غير متاح." });
    return;
  }

  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    res.status(500).json({ error: "لم يتم إعداد مفتاح Stripe السري." });
    return;
  }

  const forwardedProto = firstHeader(req.headers["x-forwarded-proto"]) ?? "https";
  const host = firstHeader(req.headers.host);
  if (!host) {
    res.status(500).json({ error: "تعذر تحديد عنوان المتجر." });
    return;
  }
  const origin = `${forwardedProto}://${host}`;
  const params = new URLSearchParams({
    mode: "payment",
    success_url: `${origin}/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/cancel`,
    "shipping_address_collection[allowed_countries][0]": "KW",
    "shipping_address_collection[allowed_countries][1]": "SA",
    "shipping_address_collection[allowed_countries][2]": "AE",
  });

  resolvedItems.forEach(({ product, quantity }, index) => {
    params.set(`line_items[${index}][quantity]`, String(quantity));
    params.set(`line_items[${index}][price_data][currency]`, product!.currency);
    params.set(`line_items[${index}][price_data][unit_amount]`, String(product!.price));
    params.set(
      `line_items[${index}][price_data][product_data][name]`,
      product!.name,
    );
    params.set(
      `line_items[${index}][price_data][product_data][description]`,
      product!.description,
    );
  });

  try {
    const stripeResponse = await fetch(
      "https://api.stripe.com/v1/checkout/sessions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${secretKey}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: params,
      },
    );
    const payload = (await stripeResponse.json()) as {
      url?: string;
      error?: { message?: string };
    };

    if (!stripeResponse.ok || !payload.url) {
      res.status(500).json({
        error: payload.error?.message ?? "تعذر بدء الدفع.",
      });
      return;
    }

    res.status(200).json({ url: payload.url });
  } catch {
    res.status(500).json({ error: "تعذر الاتصال بخدمة الدفع." });
  }
}

function firstHeader(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value?.split(",")[0];
}