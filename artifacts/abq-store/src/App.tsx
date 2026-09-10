import { type ReactNode, useMemo, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import { getListProductsQueryKey, useCreateCheckoutSession, useListProducts } from '@workspace/api-client-react';
import type { Product } from '@workspace/api-client-react';
import { ArrowLeft, Check, CircleAlert, Droplets, Gem, Minus, Plus, ShoppingBag, Sparkles, Trash2, X } from 'lucide-react';
import {
  Route,
  Switch,
  Link,
  useLocation,
  Router as WouterRouter,
} from 'wouter';

const queryClient = new QueryClient();

type CartLine = Product & { quantity: number };

const money = (amount: number, currency: string) => {
  const normalizedCurrency = currency.toUpperCase();
  const divisor = normalizedCurrency === 'KWD' ? 1000 : 100;
  return new Intl.NumberFormat('ar-AE', {
    style: 'currency',
    currency: normalizedCurrency,
    minimumFractionDigits: normalizedCurrency === 'KWD' ? 3 : 2,
  }).format(amount / divisor);
};

function ProductArtwork({ product, className = '' }: { product: Product; className?: string }) {
  const colorClass = product.id.charCodeAt(0) % 3 === 0 ? 'product-art--deep' : product.id.charCodeAt(0) % 2 === 0 ? 'product-art--light' : '';
  return (
    <div className={`product-art ${colorClass} ${className}`} aria-label={product.name}>
      {product.image ? <img src={product.image} alt={product.name} onError={(event) => { event.currentTarget.style.display = 'none'; }} /> : null}
    </div>
  );
}

function Header({ itemCount, onCart }: { itemCount: number; onCart: () => void }) {
  return (
    <header className="site-header">
      <div className="container-abq header-inner">
        <Link href="/" className="brand-lockup" data-testid="link-brand">
          <span className="brand-mark">ع</span>
          <span>
            <span className="brand-text">عبق</span>
            <span className="brand-subtitle">بيت العطور العربية</span>
          </span>
        </Link>
        <nav className="header-nav" aria-label="التنقل الرئيسي">
          <a href="#collection" data-testid="link-collection">المجموعة</a>
          <a href="#philosophy" data-testid="link-philosophy">فلسفتنا</a>
        </nav>
        <button className="cart-trigger" onClick={onCart} data-testid="button-open-cart">
          <ShoppingBag size={16} strokeWidth={1.7} />
          <span>السلة</span>
          <span className="cart-count" data-testid="text-cart-count">({itemCount})</span>
        </button>
      </div>
    </header>
  );
}

function ProductCard({ product, onAdd, adding }: { product: Product; onAdd: (product: Product) => void; adding: boolean }) {
  return (
    <article className="product-card fade-up" data-testid={`card-product-${product.id}`}>
      <div className="product-image">
        <ProductArtwork product={product} />
        {product.notes ? <span className="product-tag">{product.notes}</span> : null}
      </div>
      <div className="product-meta">
        <div className="product-meta-top">
          <h3 className="product-name" data-testid={`text-product-name-${product.id}`}>{product.name}</h3>
          <span className="product-price" data-testid={`text-product-price-${product.id}`}>{money(product.price, product.currency)}</span>
        </div>
        <p className="product-description">{product.description}</p>
        <span className="product-note">{product.notes || 'تركيبة مختارة بعناية'}</span>
        <button className="add-product" onClick={() => onAdd(product)} disabled={adding} data-testid={`button-add-product-${product.id}`}>
          {adding ? <Check size={14} /> : <Plus size={14} />}
          {adding ? 'أضيفت إلى السلة' : 'أضف إلى السلة'}
        </button>
      </div>
    </article>
  );
}

function CartPanel({ items, open, onClose, onUpdate, onRemove, onCheckout, isCheckingOut }: {
  items: CartLine[];
  open: boolean;
  onClose: () => void;
  onUpdate: (id: string, delta: number) => void;
  onRemove: (id: string) => void;
  onCheckout: () => void;
  isCheckingOut: boolean;
}) {
  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const currency = items[0]?.currency || 'sar';
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  return (
    <>
      <div className={`cart-overlay ${open ? 'is-open' : ''}`} onClick={onClose} />
      <aside className={`cart-panel ${open ? 'is-open' : ''}`} aria-label="سلة المشتريات" data-testid="panel-cart">
        <div className="cart-heading">
          <div>
            <h3>سلة مختاراتك</h3>
            <span>{itemCount ? `${itemCount} ${itemCount === 1 ? 'قطعة' : 'قطع'}` : 'لم تختر شيئاً بعد'}</span>
          </div>
          <button className="mobile-cart-close" onClick={onClose} aria-label="إغلاق السلة" data-testid="button-close-cart"><X size={19} /></button>
        </div>
        {items.length === 0 ? (
          <div className="cart-empty" data-testid="status-cart-empty">
            <span className="cart-empty-mark"><ShoppingBag size={18} strokeWidth={1.4} /></span>
            <span>السلة تنتظر عطرك الأول</span>
          </div>
        ) : (
          <>
            <div className="cart-items">
              {items.map((item) => (
                <div className="cart-item" key={item.id} data-testid={`row-cart-item-${item.id}`}>
                  <div className="cart-thumb">
                    {item.image ? <img src={item.image} alt="" onError={(event) => { event.currentTarget.style.display = 'none'; }} /> : <span className="cart-thumb-fallback" />}
                  </div>
                  <div>
                    <p className="cart-item-name">{item.name}</p>
                    <span className="cart-item-price">{money(item.price * item.quantity, item.currency)}</span>
                    <div className="quantity-control" aria-label={`كمية ${item.name}`}>
                      <button onClick={() => onUpdate(item.id, 1)} aria-label="زيادة الكمية" data-testid={`button-increase-${item.id}`}><Plus size={12} /></button>
                      <span data-testid={`text-quantity-${item.id}`}>{item.quantity}</span>
                      <button onClick={() => onUpdate(item.id, -1)} aria-label="إنقاص الكمية" data-testid={`button-decrease-${item.id}`}><Minus size={12} /></button>
                    </div>
                  </div>
                  <button className="cart-remove" onClick={() => onRemove(item.id)} aria-label={`حذف ${item.name}`} data-testid={`button-remove-${item.id}`}><Trash2 size={14} /></button>
                </div>
              ))}
            </div>
            <div className="cart-summary">
              <div className="summary-row"><span>المجموع</span><strong className="summary-total" data-testid="text-cart-total">{money(total, currency)}</strong></div>
              <button className="button-primary checkout-button" onClick={onCheckout} disabled={isCheckingOut} data-testid="button-checkout">
                {isCheckingOut ? 'جارٍ تجهيز الدفع...' : 'إتمام الطلب'}
                {!isCheckingOut ? <ArrowLeft size={16} /> : null}
              </button>
              <p className="checkout-help">ستنتقل إلى صفحة دفع آمنة عبر Stripe لإكمال طلبك.</p>
            </div>
          </>
        )}
      </aside>
    </>
  );
}

function Home() {
  const productsQuery = useListProducts({ query: { queryKey: getListProductsQueryKey(), staleTime: 300000 } });
  const checkout = useCreateCheckoutSession();
  const [cart, setCart] = useState<CartLine[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [addedId, setAddedId] = useState<string | null>(null);
  const products = productsQuery.data || [];
  const itemCount = useMemo(() => cart.reduce((sum, item) => sum + item.quantity, 0), [cart]);

  const addToCart = (product: Product) => {
    setCart((current) => {
      const existing = current.find((item) => item.id === product.id);
      if (existing) return current.map((item) => item.id === product.id ? { ...item, quantity: Math.min(10, item.quantity + 1) } : item);
      return [...current, { ...product, quantity: 1 }];
    });
    setAddedId(product.id);
    window.setTimeout(() => setAddedId(null), 1300);
  };
  const updateQuantity = (id: string, delta: number) => setCart((current) => current.flatMap((item) => {
    if (item.id !== id) return [item];
    const next = item.quantity + delta;
    return next < 1 ? [] : [{ ...item, quantity: Math.min(10, next) }];
  }));
  const removeFromCart = (id: string) => setCart((current) => current.filter((item) => item.id !== id));
  const startCheckout = () => {
    checkout.mutate({ data: { items: cart.map((item) => ({ productId: item.id, quantity: item.quantity })) } }, {
      onSuccess: (session) => { window.location.assign(session.url); },
    });
  };

  return (
    <div className="abq-app">
      <Header itemCount={itemCount} onCart={() => setCartOpen(true)} />
      <main>
        <section className="hero">
          <div className="container-abq hero-grid">
            <div className="hero-copy fade-up">
              <span className="eyebrow">عطور عربية، بروح اليوم</span>
              <h1 className="hero-title">أثرٌ يبقى،<br /><em>بعد الغياب.</em></h1>
              <p className="hero-description">ننتقي روائح شرقية عميقة ونقدّمها في تركيبات هادئة، واضحة، تترك حضورها دون أن ترفع صوتها.</p>
              <div className="hero-actions">
                <a href="#collection" className="button-primary" data-testid="link-shop-collection">اكتشف المجموعة <ArrowLeft size={16} /></a>
                <a href="#philosophy" className="button-quiet" data-testid="link-read-philosophy">حكاية عبق</a>
              </div>
              <span className="hero-note"><Sparkles size={13} /> كل زجاجة تُحضّر بعناية لتصل كما تخيلناها.</span>
            </div>
            <div className="hero-still fade-up delay-2">
              <span className="hero-index">01 / 03</span>
              <div className="still-frame">
                <div className="still-bottle"><div className="bottle-glass" /></div>
                <div className="still-caption">ماء عطر <span>EAU DE PARFUM · 50 ML</span></div>
              </div>
            </div>
          </div>
        </section>

        <section className="catalog-section" id="collection">
          <div className="container-abq">
            <div className="section-heading">
              <div><span className="eyebrow">المجموعة الأولى</span><h2>روائح لها ذاكرة</h2></div>
              <p>ثلاثة مسارات للعطر. اختر ما يشبه مزاجك، واترك للباقي أن يتكشّف.</p>
            </div>
            {productsQuery.isLoading ? (
              <div className="products-grid" data-testid="status-products-loading">
                {[1, 2, 3, 4].map((number) => <div className="product-card" key={number}><div className="product-image skeleton" /><div className="skeleton" style={{ height: 18, marginTop: 16, width: '55%' }} /><div className="skeleton" style={{ height: 12, marginTop: 11, width: '85%' }} /></div>)}
              </div>
            ) : productsQuery.isError ? (
              <div className="status-card" data-testid="status-products-error">
                <div className="status-symbol"><CircleAlert size={22} /></div>
                <h1>تعذر فتح المجموعة</h1>
                <p>حدث أمر غير متوقع أثناء تحميل العطور. جرّب مرة أخرى، وستعود الروائح إلى مكانها.</p>
                <button className="button-primary" onClick={() => productsQuery.refetch()} data-testid="button-retry-products">إعادة المحاولة</button>
              </div>
            ) : products.length === 0 ? (
              <div className="status-card" data-testid="status-products-empty">
                <div className="status-symbol"><Droplets size={22} /></div>
                <h1>المجموعة في طريقها إليك</h1>
                <p>نحضّر لك اختيارات جديدة. عُد قريباً لتشمّ أول فصل.</p>
              </div>
            ) : (
              <div className="catalog-layout">
                <div className="products-grid">
                  {products.map((product) => <ProductCard key={product.id} product={product} onAdd={addToCart} adding={addedId === product.id} />)}
                </div>
                <CartPanel items={cart} open={cartOpen} onClose={() => setCartOpen(false)} onUpdate={updateQuantity} onRemove={removeFromCart} onCheckout={startCheckout} isCheckingOut={checkout.isPending} />
              </div>
            )}
          </div>
        </section>

        <section className="values-strip" id="philosophy">
          <div className="container-abq values-grid">
            <div className="value-item"><Droplets className="value-icon" size={20} strokeWidth={1.5} /><h3>من مكوّنات تعرف طريقها</h3><p>عود، عنبر، ورد وبهارات؛ نترك لكل نغمة مساحتها كي تظهر بصدق.</p></div>
            <div className="value-item"><Gem className="value-icon" size={20} strokeWidth={1.5} /><h3>ترفٌ لا يحتاج إلى شرح</h3><p>زجاجة بسيطة، تركيبة متوازنة، وحضور يُلاحظ قبل أن يُسمّى.</p></div>
            <div className="value-item"><Sparkles className="value-icon" size={20} strokeWidth={1.5} /><h3>طقس صغير لك</h3><p>رشّة على المعصم، لحظة هدوء، ثم دع العطر يكتب بقية القصة.</p></div>
          </div>
        </section>
      </main>
      <footer className="site-footer"><div className="container-abq footer-inner"><span className="footer-copy">© ٢٠٢٤ عبق · صُنع بحب في المنطقة العربية</span><span className="footer-note">رائحة تُشبهك</span></div></footer>
      {products.length > 0 ? <div className="sr-only" data-testid="status-catalog-ready">المجموعة جاهزة</div> : null}
    </div>
  );
}

function StatusPage({ cancelled = false }: { cancelled?: boolean }) {
  return (
    <div className="abq-app">
      <div className="status-page">
        <div className="container-abq">
          <div className="status-card fade-up">
            <div className="status-symbol">{cancelled ? <X size={22} /> : <Check size={22} />}</div>
            <span className="eyebrow">{cancelled ? 'لم يكتمل الطلب' : 'تم تأكيد الطلب'}</span>
            <h1>{cancelled ? 'لا بأس، خذ وقتك.' : 'شكراً لاختيارك عبق.'}</h1>
            <p>{cancelled ? 'لم يتم خصم أي مبلغ. يمكنك العودة إلى المجموعة متى ما وجدت الرائحة التي تناديك.' : 'وصل طلبك إلينا بنجاح. سنجهّز عطرك بعناية، وستصلك تفاصيل الشحن قريباً.'}</p>
            <Link href="/" className="button-primary" data-testid="link-return-home">{cancelled ? 'العودة إلى المجموعة' : 'العودة إلى عبق'} <ArrowLeft size={16} /></Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function Router() {
  return (
    // Keep a shared shell (sidebar, navbar) outside the boundary so it
    // survives a page crash.
    <RoutedErrorBoundary>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/success"><StatusPage /></Route>
        <Route path="/cancel"><StatusPage cancelled /></Route>
        <Route component={NotFound} />
      </Switch>
    </RoutedErrorBoundary>
  );
}

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
