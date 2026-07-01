import { useState } from 'react';
import styles from './CollectionView.module.css';
import { getProductsByCategory, categories } from '../data/productsData';

export default function CollectionView({ collectionId, onNavigate, onAddToCart, onToggleWishlist, wishlist = [] }) {
  const products = getProductsByCategory(collectionId);
  const categoryInfo = categories.find(c => c.id === collectionId) || { name: 'COLLECTION' };

  // Filter States
  const [filterGender, setFilterGender] = useState('all');
  const [filterSize, setFilterSize] = useState('all');
  const [filterNote, setFilterNote] = useState('all');

  // Filter Logic
  const filteredProducts = products.filter(p => {
    // Gender Filter
    if (filterGender !== 'all') {
      if (p.gender && p.gender.toLowerCase() !== filterGender.toLowerCase()) {
        return false;
      }
    }

    // Size Filter
    if (filterSize !== 'all') {
      const sizeLower = filterSize.toLowerCase(); // e.g. '50ml', '100ml', '200ml'
      
      const productSizes = p.sizes ? p.sizes.map(s => s.toLowerCase()) : [p.volume?.toLowerCase()];
      const matchesSize = productSizes.some(s => s.replace(/\s+/g, '') === sizeLower);
      if (!matchesSize) return false;
    }

    // Note Filter
    if (filterNote !== 'all') {
      const noteLower = filterNote.toLowerCase();
      // check noteTags
      const matchesTag = p.noteTags && p.noteTags.some(tag => tag.toLowerCase() === noteLower);
      // check descriptions/notes
      const matchesDesc = p.description && p.description.toLowerCase().includes(noteLower);
      const matchesNotesList = p.notes && (
        p.notes.top?.toLowerCase().includes(noteLower) || 
        p.notes.heart?.toLowerCase().includes(noteLower) || 
        p.notes.base?.toLowerCase().includes(noteLower)
      );
      
      if (!matchesTag && !matchesDesc && !matchesNotesList) return false;
    }

    return true;
  });

  const handleBuyNow = (p) => {
    let msg = `Hello Razi Perfumes! I would like to order:\n\n`;
    msg += `• ${p.name} (${p.sizes ? p.sizes[0] : p.volume}) x 1 - ${p.prices ? p.prices[p.sizes[0]] : p.price}\n\n`;
    msg += `Please confirm my order. Thank you!`;
    
    const encoded = encodeURIComponent(msg);
    const whatsappUrl = `https://wa.me/919061627236?text=${encoded}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <div className={styles.container}>
      {/* Breadcrumbs */}
      <div className={styles.breadcrumbs}>
        <span onClick={() => onNavigate('home')} className={styles.breadcrumbLink}>HOME</span>
        <span className={styles.separator}>/</span>
        <span className={styles.current}>{categoryInfo.name.toUpperCase()}</span>
      </div>

      <header className={styles.header}>
        <h1 className={styles.title}>{categoryInfo.name}</h1>
        <p className={styles.count}>{filteredProducts.length} Products</p>
      </header>

      {/* Filter Panel */}
      <div className={styles.filterBar}>
        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>GENDER</label>
          <select 
            value={filterGender} 
            onChange={(e) => setFilterGender(e.target.value)}
            className={styles.filterSelect}
          >
            <option value="all">ALL GENDERS</option>
            <option value="male">MALE</option>
            <option value="female">FEMALE</option>
            <option value="unisex">UNISEX</option>
          </select>
        </div>

        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>VOLUME</label>
          <select 
            value={filterSize} 
            onChange={(e) => setFilterSize(e.target.value)}
            className={styles.filterSelect}
          >
            <option value="all">ALL SIZES</option>
            <option value="50ml">50ML</option>
            <option value="100ml">100ML</option>
            <option value="200ml">200ML (SIGNATURE)</option>
          </select>
        </div>

        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>SCENT TYPE</label>
          <select 
            value={filterNote} 
            onChange={(e) => setFilterNote(e.target.value)}
            className={styles.filterSelect}
          >
            <option value="all">ALL SCENTS</option>
            <option value="spicy">SPICY</option>
            <option value="woody">WOODY</option>
            <option value="sweet">SWEET</option>
            <option value="fruity">FRUITY</option>
            <option value="floral">FLORAL</option>
            <option value="musky">MUSKY</option>
            <option value="oud">OUD</option>
          </select>
        </div>

        {/* Reset Button */}
        {(filterGender !== 'all' || filterSize !== 'all' || filterNote !== 'all') && (
          <button 
            onClick={() => {
              setFilterGender('all');
              setFilterSize('all');
              setFilterNote('all');
            }}
            className={styles.clearBtn}
          >
            RESET FILTERS
          </button>
        )}
      </div>

      {filteredProducts.length === 0 ? (
        <p className={styles.empty}>No products match your selected filters.</p>
      ) : (
        <div className={styles.grid}>
          {filteredProducts.map(p => {
            const isWishlisted = wishlist.includes(p.id);
            return (
              <div key={p.id} className={styles.card}>
                <div className={styles.imageWrap}>
                  <img 
                    src={p.image} 
                    alt={p.name} 
                    className={styles.productImage} 
                    onClick={() => onNavigate('product', null, p.id)}
                  />
                  
                  {/* Wishlist Icon */}
                  <button 
                    className={`${styles.wishlistIcon} ${isWishlisted ? styles.wishlisted : ''}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleWishlist && onToggleWishlist(p.id);
                    }}
                    aria-label="Add to wishlist"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill={isWishlisted ? 'var(--gold)' : 'none'} stroke={isWishlisted ? 'var(--gold)' : 'currentColor'} strokeWidth="1.5">
                      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                    </svg>
                  </button>
 
                  {/* Action Overlays */}
                  <div className={styles.actionOverlay}>
                    <button className={styles.actionBtn} onClick={() => onAddToCart(p)}>
                      ADD TO CART
                    </button>
                    <button className={`${styles.actionBtn} ${styles.buyNowBtn}`} onClick={() => handleBuyNow(p)}>
                      BUY NOW
                    </button>
                  </div>
 
                  {/* Mobile Actions */}
                  <div className={styles.mobileActions}>
                    <button className={styles.mobileBuyBtn} onClick={() => handleBuyNow(p)}>
                      ⚡ BUY
                    </button>
                    <button className={styles.mobileAddBtn} onClick={() => onAddToCart(p)}>
                      +
                    </button>
                  </div>
                </div>
 
                <div 
                  className={styles.info} 
                  onClick={() => onNavigate('product', null, p.id)}
                >
                  <h3 className={styles.name}>{p.name}</h3>
                  <p className={styles.volume}>
                    {p.sizes ? p.sizes.join(' / ') : p.volume}
                  </p>
                  <p className={styles.price}>
                    {p.prices 
                      ? `${p.prices['50ml']} - ${p.prices['100ml']}` 
                      : p.price
                    }
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
