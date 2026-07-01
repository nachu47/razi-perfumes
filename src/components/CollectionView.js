import styles from './CollectionView.module.css';
import { getProductsByCategory, categories } from '../data/productsData';

export default function CollectionView({ collectionId, onNavigate, onAddToCart, onToggleWishlist, wishlist = [] }) {
  const products = getProductsByCategory(collectionId);
  const categoryInfo = categories.find(c => c.id === collectionId) || { name: 'COLLECTION' };

  const handleBuyNow = (p) => {
    let msg = `Hello Razi Perfumes! I would like to order:\n\n`;
    msg += `• ${p.name} (${p.volume}) x 1 - ${p.price}\n\n`;
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
        <p className={styles.count}>{products.length} Products</p>
      </header>

      {products.length === 0 ? (
        <p className={styles.empty}>No products available in this collection yet.</p>
      ) : (
        <div className={styles.grid}>
          {products.map(p => {
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
                  <p className={styles.volume}>{p.volume}</p>
                  <p className={styles.price}>{p.price}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
