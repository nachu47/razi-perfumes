import { useState, useEffect } from 'react';
import Header from './components/Header';
import HeroSlider from './components/HeroSlider';
import ProductCarousel from './components/ProductCarousel';
import CategorySection from './components/CategorySection';
import Footer from './components/Footer';
import CountryModal from './components/CountryModal';
import SidebarDrawer from './components/SidebarDrawer';
import CollectionView from './components/CollectionView';
import ProductDetailView from './components/ProductDetailView';
import logo from './assets/logo.png';
import TransparentLogo from './components/TransparentLogo';

export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [showCountryModal, setShowCountryModal] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [cart, setCart] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [country, setCountry] = useState(null);

  // Custom SPA Routing State
  const [currentView, setCurrentView] = useState('home');
  const [activeCollectionId, setActiveCollectionId] = useState(null);
  const [activeProductId, setActiveProductId] = useState(null);

  // Router logic using HTML5 History API
  const navigate = (view, collectionId = null, productId = null) => {
    setCurrentView(view);
    setActiveCollectionId(collectionId);
    setActiveProductId(productId);

    let path = '/';
    if (view === 'collection') path = `/collection/${collectionId}`;
    if (view === 'product') path = `/product/${productId}`;

    window.history.pushState({ view, collectionId, productId }, '', path);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Splash Screen Timeout
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 2500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // Show country modal on first load if not set
    const savedCountry = localStorage.getItem('razi_country');
    const savedWishlist = localStorage.getItem('razi_wishlist');

    if (!savedCountry) {
      // Don't show immediately during splash
      const delay = setTimeout(() => {
        setShowCountryModal(true);
      }, 2600);
      return () => clearTimeout(delay);
    } else {
      setCountry(JSON.parse(savedCountry));
    }

    if (savedWishlist) {
      setWishlist(JSON.parse(savedWishlist));
    }
  }, []);

  // History Navigation listener & initial path loader
  useEffect(() => {
    const handlePopState = (e) => {
      const state = e.state || {};
      setCurrentView(state.view || 'home');
      setActiveCollectionId(state.collectionId || null);
      setActiveProductId(state.productId || null);
    };

    const path = window.location.pathname;
    const pathParts = path.split('/');
    if (pathParts[1] === 'collection' && pathParts[2]) {
      setCurrentView('collection');
      setActiveCollectionId(pathParts[2]);
    } else if (pathParts[1] === 'product' && pathParts[2]) {
      setCurrentView('product');
      setActiveProductId(pathParts[2]);
    }

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleSelectCountry = (selectedCountry, lang) => {
    setCountry(selectedCountry);
    localStorage.setItem('razi_country', JSON.stringify(selectedCountry));
  };

  const handleAddToCart = (product) => {
    // Add product or increase quantity if already exists (differentiated by id and volume)
    const existing = cart.find(item => item.id === product.id && item.volume === product.volume);
    if (existing) {
      setCart(cart.map(item =>
        (item.id === product.id && item.volume === product.volume) ? { ...item, quantity: item.quantity + 1 } : item
      ));
    } else {
      setCart([...cart, { ...product, quantity: 1 }]);
    }
    setCartOpen(true);
  };

  const handleRemoveFromCart = (productId, volume) => {
    setCart(cart.filter(item => !(item.id === productId && item.volume === volume)));
  };

  const handleUpdateQuantity = (productId, volume, amount) => {
    setCart(cart.map(item => {
      if (item.id === productId && item.volume === volume) {
        const nextQty = item.quantity + amount;
        return nextQty > 0 ? { ...item, quantity: nextQty } : item;
      }
      return item;
    }));
  };

  const handleToggleWishlist = (productId) => {
    let updated;
    if (wishlist.includes(productId)) {
      updated = wishlist.filter(id => id !== productId);
    } else {
      updated = [...wishlist, productId];
    }
    setWishlist(updated);
    localStorage.setItem('razi_wishlist', JSON.stringify(updated));
  };

  // Calculate cart total price
  const calculateTotal = () => {
    const totalNum = cart.reduce((sum, item) => {
      const priceNum = parseFloat(item.price.replace(/[^\d.]/g, ''));
      return sum + (priceNum * item.quantity);
    }, 0);
    const currency = country?.currency || 'KD';
    return `${totalNum.toFixed(3)} ${currency}`;
  };

  const handleCheckout = () => {
    if (cart.length === 0) return;

    let msg = `Hello Razi Perfumes! I would like to place an order:\n\n`;
    cart.forEach((item, index) => {
      msg += `${index + 1}. ${item.name} (${item.volume}) x ${item.quantity} - ${item.price}\n`;
    });
    msg += `\nTotal: ${calculateTotal()}\n`;
    msg += `Country: ${country ? country.name : 'Not selected'}\n\n`;
    msg += `Please confirm my order. Thank you!`;

    const encoded = encodeURIComponent(msg);
    const whatsappUrl = `https://wa.me/919061627236?text=${encoded}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <div style={{ background: 'var(--ivory)', minHeight: '100vh', display: 'flex', flexDirection: 'column', overflowX: 'hidden', width: '100%' }}>
      {/* Splash Screen */}
      <div className={`pre-home-overlay ${!showSplash ? 'hidden' : ''}`}>
        <div className="pre-home-container">
          <div className="pre-home-ring"></div>
          <TransparentLogo src={logo} invertToWhite={true} alt="Razi Perfumes" className="pre-home-logo-img" />
        </div>
      </div>

      {showCountryModal && (
        <CountryModal
          onClose={() => setShowCountryModal(false)}
          onSelectCountry={handleSelectCountry}
        />
      )}

      <Header
        onSearchOpen={() => setSearchOpen(true)}
        onCartOpen={() => setCartOpen(true)}
        onCountryOpen={() => setShowCountryModal(true)}
        cartCount={cart.reduce((sum, item) => sum + item.quantity, 0)}
        wishlistCount={wishlist.length}
        onNavigate={navigate}
      />

      {/* Main View Router */}
      <main style={{ flex: 1 }}>
        {currentView === 'home' && (
          <>
            <HeroSlider />

            <ProductCarousel
              title="RECOMMENDED FOR YOU"
              type="signature"
              onAddToCart={handleAddToCart}
              onToggleWishlist={handleToggleWishlist}
              wishlist={wishlist}
              onNavigate={navigate}
            />

            <CategorySection onNavigate={navigate} />

            {/* Category Highlight Section */}
            <section
              className="highlightSection"
              style={{ backgroundImage: `url('https://kw.gissah.com/web/image/product.public.category/18/background_image/1920x0?unique=1ab1e03')` }}
            >
              <div className="highlightOverlay" />
              <div className="highlightContent">
                <span className="highlightSubtitle">Sets Line</span>
                <h2 className="highlightTitle">Curated Gift Collections</h2>
                <a
                  href="/collection/sets"
                  className="highlightCta"
                  onClick={(e) => {
                    e.preventDefault();
                    navigate('collection', 'sets');
                  }}
                >
                  DISCOVER
                </a>
              </div>
            </section>

            <ProductCarousel
              title="LUXURY LINE"
              type="luxury"
              onAddToCart={handleAddToCart}
              onToggleWishlist={handleToggleWishlist}
              wishlist={wishlist}
              onNavigate={navigate}
            />
          </>
        )}

        {currentView === 'collection' && (
          <CollectionView
            collectionId={activeCollectionId}
            onNavigate={navigate}
            onAddToCart={handleAddToCart}
            onToggleWishlist={handleToggleWishlist}
            wishlist={wishlist}
          />
        )}

        {currentView === 'product' && (
          <ProductDetailView
            productId={activeProductId}
            onNavigate={navigate}
            onAddToCart={handleAddToCart}
            onToggleWishlist={handleToggleWishlist}
            wishlist={wishlist}
          />
        )}
      </main>

      <Footer />

      {/* Drawers */}
      <SidebarDrawer
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
        title="SEARCH"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <input
            type="text"
            placeholder="Search products..."
            style={{
              padding: '18px 24px',
              border: '1px solid var(--light-gray)',
              fontFamily: 'var(--font-body)',
              fontSize: '13px',
              outline: 'none',
              width: '100%',
              backgroundColor: 'var(--white)'
            }}
          />
          <p style={{ fontSize: '13px', color: 'var(--mid-gray)', fontStyle: 'italic', fontFamily: 'var(--font-display)' }}>
            Start typing to search our luxury collections...
          </p>
        </div>
      </SidebarDrawer>

      <SidebarDrawer
        isOpen={cartOpen}
        onClose={() => setCartOpen(false)}
        title="BASKET"
      >
        {cart.length === 0 ? (
          <p style={{ fontSize: '14px', color: 'var(--mid-gray)', fontStyle: 'italic', fontFamily: 'var(--font-display)', textAlign: 'center', marginTop: '40px' }}>
            Your basket is currently empty.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {cart.map((item) => (
                <div key={`${item.id}-${item.volume}`} style={{ display: 'flex', gap: '16px', borderBottom: '1px solid var(--light-gray)', paddingBottom: '20px' }}>
                  <div style={{ width: '80px', height: '100px', backgroundColor: 'var(--cream)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(0,0,0,0.03)' }}>
                    <img src={item.image} alt={item.name} style={{ maxWidth: '90%', maxHeight: '90%', objectFit: 'contain' }} />
                  </div>
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <h4 style={{ fontSize: '13px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: 'var(--font-heading)' }}>{item.name}</h4>
                        <button
                          onClick={() => handleRemoveFromCart(item.id, item.volume)}
                          style={{ fontSize: '12px', color: 'var(--mid-gray)', cursor: 'pointer' }}
                        >
                          ✕
                        </button>
                      </div>
                      <p style={{ fontSize: '12px', color: 'var(--mid-gray)', fontStyle: 'italic', fontFamily: 'var(--font-display)', marginTop: '2px' }}>{item.volume}</p>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', border: '1px solid var(--light-gray)', background: 'var(--white)' }}>
                        <button
                          onClick={() => handleUpdateQuantity(item.id, item.volume, -1)}
                          style={{ padding: '6px 12px', fontSize: '12px', fontWeight: 600 }}
                        >
                          -
                        </button>
                        <span style={{ padding: '0 8px', fontSize: '12px', fontWeight: 600 }}>{item.quantity}</span>
                        <button
                          onClick={() => handleUpdateQuantity(item.id, item.volume, 1)}
                          style={{ padding: '6px 12px', fontSize: '12px', fontWeight: 600 }}
                        >
                          +
                        </button>
                      </div>
                      <p style={{ fontSize: '13px', color: 'var(--gold-dark)', fontWeight: 600 }}>{item.price}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ borderTop: '1px solid var(--light-gray)', paddingTop: '24px', marginTop: 'auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', fontFamily: 'var(--font-heading)' }}>
                <span style={{ fontSize: '13px', fontWeight: 600, letterSpacing: '0.1em' }}>TOTAL</span>
                <span style={{ fontSize: '15px', fontWeight: 700, color: 'var(--gold-dark)' }}>{calculateTotal()}</span>
              </div>
              <button
                onClick={handleCheckout}
                style={{
                  width: '100%',
                  padding: '18px',
                  background: 'var(--dark)',
                  color: 'var(--white)',
                  border: 'none',
                  fontFamily: 'var(--font-body)',
                  fontWeight: 700,
                  letterSpacing: '0.3em',
                  fontSize: '11px',
                  cursor: 'pointer',
                  transition: 'background var(--transition)'
                }}
              >
                PROCEED TO CHECKOUT
              </button>
            </div>
          </div>
        )}
      </SidebarDrawer>
    </div>
  );
}
