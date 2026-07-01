'use client';
import { useState, useEffect } from 'react';
import Header from '../components/Header';
import HeroSlider from '../components/HeroSlider';
import ProductCarousel from '../components/ProductCarousel';
import CategorySection from '../components/CategorySection';
import Footer from '../components/Footer';
import CountryModal from '../components/CountryModal';
import SidebarDrawer from '../components/SidebarDrawer';

export default function Home() {
  const [showSplash, setShowSplash] = useState(true);
  const [showCountryModal, setShowCountryModal] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [cart, setCart] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [country, setCountry] = useState(null);

  // Splash Screen Timeout
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 2500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // Show country modal on first load if not set
    const savedCountry = localStorage.getItem('gissah_country');
    const savedWishlist = localStorage.getItem('gissah_wishlist');
    
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

  const handleSelectCountry = (selectedCountry, lang) => {
    setCountry(selectedCountry);
    localStorage.setItem('gissah_country', JSON.stringify(selectedCountry));
  };

  const handleAddToCart = (product) => {
    // Add product or increase quantity if already exists
    const existing = cart.find(item => item.id === product.id);
    if (existing) {
      setCart(cart.map(item => 
        item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
      ));
    } else {
      setCart([...cart, { ...product, quantity: 1 }]);
    }
    setCartOpen(true);
  };

  const handleRemoveFromCart = (productId) => {
    setCart(cart.filter(item => item.id !== productId));
  };

  const handleUpdateQuantity = (productId, amount) => {
    setCart(cart.map(item => {
      if (item.id === productId) {
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
    localStorage.setItem('gissah_wishlist', JSON.stringify(updated));
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

  return (
    <main style={{ background: 'var(--ivory)', minHeight: '100vh' }}>
      {/* Splash Screen */}
      <div className={`pre-home-overlay ${!showSplash ? 'hidden' : ''}`}>
        <div className="pre-home-container">
          <div className="pre-home-ring"></div>
          <h1 className="pre-home-logo">GISSAH</h1>
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
      />

      <HeroSlider />

      <ProductCarousel 
        title="RECOMMENDED FOR YOU" 
        type="signature"
        onAddToCart={handleAddToCart}
        onToggleWishlist={handleToggleWishlist}
        wishlist={wishlist}
      />

      <CategorySection />

      {/* Category Highlight Section */}
      <section 
        className="highlightSection"
        style={{ backgroundImage: `url('https://kw.gissah.com/web/image/product.public.category/18/background_image/1920x0?unique=1ab1e03')` }}
      >
        <div className="highlightOverlay" />
        <div className="highlightContent">
          <span className="highlightSubtitle">Sets Line</span>
          <h2 className="highlightTitle">Curated Gift Collections</h2>
          <a href="/shop" className="highlightCta">DISCOVER</a>
        </div>
      </section>

      <ProductCarousel 
        title="LUXURY LINE" 
        type="luxury"
        onAddToCart={handleAddToCart}
        onToggleWishlist={handleToggleWishlist}
        wishlist={wishlist}
      />

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
              {cart.map((item, i) => (
                <div key={item.id} style={{ display: 'flex', gap: '16px', borderBottom: '1px solid var(--light-gray)', paddingBottom: '20px' }}>
                  <div style={{ width: '80px', height: '100px', backgroundColor: 'var(--cream)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(0,0,0,0.03)' }}>
                    <img src={item.image} alt={item.name} style={{ maxWidth: '90%', maxHeight: '90%', objectFit: 'contain' }} />
                  </div>
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <h4 style={{ fontSize: '13px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: 'var(--font-heading)' }}>{item.name}</h4>
                        <button 
                          onClick={() => handleRemoveFromCart(item.id)}
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
                          onClick={() => handleUpdateQuantity(item.id, -1)}
                          style={{ padding: '6px 12px', fontSize: '12px', fontWeight: 600 }}
                        >
                          -
                        </button>
                        <span style={{ padding: '0 8px', fontSize: '12px', fontWeight: 600 }}>{item.quantity}</span>
                        <button 
                          onClick={() => handleUpdateQuantity(item.id, 1)}
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
              <button style={{
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
              }}>
                PROCEED TO CHECKOUT
              </button>
            </div>
          </div>
        )}
      </SidebarDrawer>
    </main>
  );
}

