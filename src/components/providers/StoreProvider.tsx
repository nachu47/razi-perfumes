'use client';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { api } from '@/lib/client-api';
import { convertFromKWD, formatMoney, type Rates } from '@/lib/money';
import { getCountry, type CountryCode, type CountryInfo } from '@/lib/countries';
import type { CartDTO } from '@/lib/cart';

export interface SessionUserLite {
  id: string;
  name?: string | null;
  email?: string | null;
  role: 'CUSTOMER' | 'ADMIN';
}

type ToastKind = 'success' | 'error';
interface Toast {
  id: number;
  message: string;
  kind: ToastKind;
}

interface StoreContextValue {
  locale: string;
  country: CountryInfo;
  rates: Rates;
  user: SessionUserLite | null;
  /** Convert a KWD catalogue price to the visitor currency and format it */
  price: (kwd: number) => string;
  /** Format an amount that is already in `currency` */
  money: (amount: number, currency?: string) => string;
  setCountry: (code: CountryCode) => Promise<void>;

  cart: CartDTO | null;
  cartCount: number;
  cartLoading: boolean;
  refreshCart: () => Promise<void>;
  addToCart: (variantId: string, quantity?: number, opts?: { openDrawer?: boolean; silent?: boolean }) => Promise<boolean>;
  updateCartItem: (itemId: string, quantity: number) => Promise<void>;
  removeCartItem: (itemId: string) => Promise<void>;
  applyCoupon: (code: string) => Promise<boolean>;
  removeCoupon: () => Promise<void>;
  buyNow: (variantId: string, quantity?: number) => void;

  wishlist: string[];
  isWishlisted: (productId: string) => boolean;
  toggleWishlist: (productId: string) => Promise<void>;
  refreshWishlist: () => Promise<void>;

  cartOpen: boolean;
  setCartOpen: (open: boolean) => void;
  searchOpen: boolean;
  setSearchOpen: (open: boolean) => void;
  menuOpen: boolean;
  setMenuOpen: (open: boolean) => void;
  countryModalOpen: boolean;
  setCountryModalOpen: (open: boolean) => void;

  toast: (message: string, kind?: ToastKind) => void;
}

const StoreContext = createContext<StoreContextValue | null>(null);

export function useStore(): StoreContextValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used inside <StoreProvider>');
  return ctx;
}

export default function StoreProvider({
  children,
  initialCountry,
  hasCountryCookie,
  rates,
  user,
}: {
  children: ReactNode;
  initialCountry: CountryCode;
  hasCountryCookie: boolean;
  rates: Rates;
  user: SessionUserLite | null;
}) {
  const locale = useLocale();
  const router = useRouter();
  const t = useTranslations('toast');
  const [country, setCountryState] = useState<CountryInfo>(getCountry(initialCountry));
  const [cart, setCart] = useState<CartDTO | null>(null);
  const [cartLoading, setCartLoading] = useState(true);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [countryModalOpen, setCountryModalOpen] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toastId = useRef(0);

  const toast = useCallback((message: string, kind: ToastKind = 'success') => {
    const id = ++toastId.current;
    setToasts((ts) => [...ts.slice(-2), { id, message, kind }]);
    setTimeout(() => setToasts((ts) => ts.filter((x) => x.id !== id)), 3200);
  }, []);

  const fail = useCallback((err: unknown) => toast(err instanceof Error ? err.message : String(err), 'error'), [toast]);

  const refreshCart = useCallback(async () => {
    try {
      setCart(await api<CartDTO>('/api/cart'));
    } catch {
      /* keep previous cart */
    } finally {
      setCartLoading(false);
    }
  }, []);

  const refreshWishlist = useCallback(async () => {
    try {
      const data = await api<{ productIds: string[] }>('/api/wishlist');
      setWishlist(data.productIds);
    } catch {
      /* ignore */
    }
  }, []);

  // Load cart + wishlist on mount and whenever the signed-in user changes (merges guest data on login)
  useEffect(() => {
    void refreshCart();
    void refreshWishlist();
  }, [user?.id, refreshCart, refreshWishlist]);

  // First visit: ask for country + language (after the splash screen)
  useEffect(() => {
    if (hasCountryCookie) return;
    const timer = setTimeout(() => setCountryModalOpen(true), 2600);
    return () => clearTimeout(timer);
  }, [hasCountryCookie]);

  const setCountry = useCallback(
    async (code: CountryCode) => {
      try {
        const { country: c } = await api<{ country: CountryInfo }>('/api/preferences', { body: { country: code } });
        setCountryState(c);
        await refreshCart();
        router.refresh(); // re-render server components with the new currency
        toast(t('countryChanged', { currency: c.currency }));
      } catch (e) {
        fail(e);
      }
    },
    [refreshCart, router, toast, t, fail],
  );

  const addToCart = useCallback<StoreContextValue['addToCart']>(
    async (variantId, quantity = 1, opts = {}) => {
      try {
        setCart(await api<CartDTO>('/api/cart/items', { body: { variantId, quantity } }));
        if (!opts.silent) toast(t('addedToCart'));
        if (opts.openDrawer !== false) setCartOpen(true);
        return true;
      } catch (e) {
        fail(e);
        return false;
      }
    },
    [toast, t, fail],
  );

  const updateCartItem = useCallback(
    async (itemId: string, quantity: number) => {
      try {
        setCart(await api<CartDTO>(`/api/cart/items/${itemId}`, { method: 'PATCH', body: { quantity } }));
      } catch (e) {
        fail(e);
      }
    },
    [fail],
  );

  const removeCartItem = useCallback(
    async (itemId: string) => {
      try {
        setCart(await api<CartDTO>(`/api/cart/items/${itemId}`, { method: 'DELETE' }));
        toast(t('removedFromCart'));
      } catch (e) {
        fail(e);
      }
    },
    [toast, t, fail],
  );

  const applyCoupon = useCallback(
    async (code: string) => {
      try {
        setCart(await api<CartDTO>('/api/cart/coupon', { body: { code } }));
        toast(t('couponApplied'));
        return true;
      } catch (e) {
        fail(e);
        return false;
      }
    },
    [toast, t, fail],
  );

  const removeCoupon = useCallback(async () => {
    try {
      setCart(await api<CartDTO>('/api/cart/coupon', { method: 'DELETE' }));
      toast(t('couponRemoved'));
    } catch (e) {
      fail(e);
    }
  }, [toast, t, fail]);

  const buyNow = useCallback(
    (variantId: string, quantity = 1) => {
      setCartOpen(false);
      router.push(`/checkout?buyNow=${encodeURIComponent(variantId)}&qty=${quantity}`);
    },
    [router],
  );

  const toggleWishlist = useCallback(
    async (productId: string) => {
      const was = wishlist.includes(productId);
      setWishlist((w) => (was ? w.filter((id) => id !== productId) : [productId, ...w])); // optimistic
      try {
        const data = await api<{ added: boolean; productIds: string[] }>('/api/wishlist/toggle', { body: { productId } });
        setWishlist(data.productIds);
        toast(data.added ? t('addedToWishlist') : t('removedFromWishlist'));
      } catch (e) {
        setWishlist((w) => (was ? [productId, ...w] : w.filter((id) => id !== productId)));
        fail(e);
      }
    },
    [wishlist, toast, t, fail],
  );

  const value = useMemo<StoreContextValue>(
    () => ({
      locale,
      country,
      rates,
      user,
      price: (kwd) => formatMoney(convertFromKWD(kwd, country.currency, rates), country.currency, locale),
      money: (amount, currency) => formatMoney(amount, currency ?? country.currency, locale),
      setCountry,
      cart,
      cartCount: cart?.count ?? 0,
      cartLoading,
      refreshCart,
      addToCart,
      updateCartItem,
      removeCartItem,
      applyCoupon,
      removeCoupon,
      buyNow,
      wishlist,
      isWishlisted: (id) => wishlist.includes(id),
      toggleWishlist,
      refreshWishlist,
      cartOpen,
      setCartOpen,
      searchOpen,
      setSearchOpen,
      menuOpen,
      setMenuOpen,
      countryModalOpen,
      setCountryModalOpen,
      toast,
    }),
    [locale, country, rates, user, setCountry, cart, cartLoading, refreshCart, addToCart, updateCartItem, removeCartItem, applyCoupon, removeCoupon, buyNow, wishlist, toggleWishlist, refreshWishlist, cartOpen, searchOpen, menuOpen, countryModalOpen, toast],
  );

  return (
    <StoreContext.Provider value={value}>
      {children}
      <div className="toast-stack" role="status" aria-live="polite">
        {toasts.map((x) => (
          <div key={x.id} className={`toast ${x.kind === 'error' ? 'error' : ''}`}>
            {x.message}
          </div>
        ))}
      </div>
    </StoreContext.Provider>
  );
}
