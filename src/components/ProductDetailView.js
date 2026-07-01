import { useState } from 'react';
import styles from './ProductDetailView.module.css';
import { getProductById, categories } from '../data/productsData';

export default function ProductDetailView({ productId, onNavigate, onAddToCart, onToggleWishlist, wishlist = [] }) {
  const product = getProductById(productId);
  const [qty, setQty] = useState(1);
  const [activeTab, setActiveTab] = useState('notes'); // notes | ingredients

  const handleBuyNow = () => {
    let msg = `Hello Razi Perfumes! I would like to order:\n\n`;
    msg += `• ${product.name} (${product.volume}) x ${qty} - ${product.price}\n\n`;
    msg += `Please confirm my order. Thank you!`;
    
    const encoded = encodeURIComponent(msg);
    const whatsappUrl = `https://wa.me/919061627236?text=${encoded}`;
    window.open(whatsappUrl, '_blank');
  };

  if (!product) {
    return (
      <div className={styles.container}>
        <p className={styles.notFound}>Product not found.</p>
        <button onClick={() => onNavigate('home')} className={styles.backBtn}>BACK TO HOME</button>
      </div>
    );
  }

  const categoryInfo = categories.find(c => c.id === product.category) || { name: 'Signature Line' };
  const isWishlisted = wishlist.includes(product.id);

  const increment = () => setQty(prev => prev + 1);
  const decrement = () => setQty(prev => (prev > 1 ? prev - 1 : 1));

  const handleAddToCartWithQty = () => {
    // Add product to cart with specified quantity
    for (let i = 0; i < qty; i++) {
      onAddToCart(product);
    }
  };

  return (
    <div className={styles.container}>
      {/* Breadcrumbs */}
      <div className={styles.breadcrumbs}>
        <span onClick={() => onNavigate('home')} className={styles.breadcrumbLink}>HOME</span>
        <span className={styles.separator}>/</span>
        <span onClick={() => onNavigate('collection', product.category)} className={styles.breadcrumbLink}>
          {categoryInfo.name.toUpperCase()}
        </span>
        <span className={styles.separator}>/</span>
        <span className={styles.current}>{product.name.toUpperCase()}</span>
      </div>

      <div className={styles.wrapper}>
        {/* Left: Product Image */}
        <div className={styles.imageColumn}>
          <div className={styles.imageBox}>
            <img src={product.image} alt={product.name} className={styles.mainImage} />
          </div>
        </div>

        {/* Right: Product Details */}
        <div className={styles.detailsColumn}>
          <div className={styles.meta}>
            <span className={styles.categoryLabel}>{categoryInfo.name}</span>
            <h1 className={styles.title}>{product.name}</h1>
            <p className={styles.volume}>{product.volume}</p>
            <p className={styles.price}>{product.price}</p>
          </div>

          <p className={styles.description}>{product.description}</p>

          {/* Product Specs Tabs */}
          <div className={styles.tabsContainer}>
            <div className={styles.tabsHeaders}>
              <button 
                className={`${styles.tabHeader} ${activeTab === 'notes' ? styles.activeTab : ''}`}
                onClick={() => setActiveTab('notes')}
              >
                FRAGRANCE NOTES
              </button>
              <button 
                className={`${styles.tabHeader} ${activeTab === 'ingredients' ? styles.activeTab : ''}`}
                onClick={() => setActiveTab('ingredients')}
              >
                INGREDIENTS
              </button>
            </div>

            <div className={styles.tabBody}>
              {activeTab === 'notes' ? (
                <div className={styles.notesList}>
                  <div className={styles.noteItem}>
                    <strong className={styles.noteLabel}>TOP NOTES:</strong>
                    <span className={styles.noteValue}>{product.notes.top}</span>
                  </div>
                  <div className={styles.noteItem}>
                    <strong className={styles.noteLabel}>HEART NOTES:</strong>
                    <span className={styles.noteValue}>{product.notes.heart}</span>
                  </div>
                  <div className={styles.noteItem}>
                    <strong className={styles.noteLabel}>BASE NOTES:</strong>
                    <span className={styles.noteValue}>{product.notes.base}</span>
                  </div>
                </div>
              ) : (
                <p className={styles.ingredients}>{product.ingredients}</p>
              )}
            </div>
          </div>

          {/* Quantity and Actions */}
          <div className={styles.actionsBlock}>
            <div className={styles.qtyLabel}>QUANTITY</div>
            <div className={styles.qtyRow}>
              <div className={styles.qtySelector}>
                <button onClick={decrement} className={styles.qtyBtn}>-</button>
                <span className={styles.qtyValue}>{qty}</span>
                <button onClick={increment} className={styles.qtyBtn}>+</button>
              </div>

              <button 
                className={`${styles.wishlistBtn} ${isWishlisted ? styles.wishlisted : ''}`}
                onClick={() => onToggleWishlist(product.id)}
                aria-label="Toggle wishlist"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill={isWishlisted ? 'var(--gold)' : 'none'} stroke={isWishlisted ? 'var(--gold)' : 'currentColor'} strokeWidth="1.5">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                </svg>
              </button>
            </div>

            <div className={styles.buttonGroup}>
              <button 
                onClick={handleAddToCartWithQty} 
                className={styles.addToCartBtn}
              >
                ADD TO BASKET
              </button>
              <button 
                onClick={handleBuyNow} 
                className={styles.buyNowBtn}
              >
                BUY NOW
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
