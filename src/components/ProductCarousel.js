'use client';
import { useRef, useState } from 'react';
import styles from './ProductCarousel.module.css';

const allProducts = {
  signature: [
    { id: 'p1', name: 'Beyond Me', volume: '200 Ml', price: '23.000 KD', image: 'https://kw.gissah.com/web/image/product.product/1322/image_1920/1024x0?unique=9639072' },
    { id: 'p2', name: 'Hudson Amora', volume: '200 Ml', price: '23.000 KD', image: 'https://kw.gissah.com/web/image/product.product/1244/image_1920/1024x0?unique=4057cb6' },
    { id: 'p3', name: 'Hudson Valley', volume: '200 Ml', price: '23.000 KD', image: 'https://kw.gissah.com/web/image/product.product/733/image_1920/1024x0?unique=82f3ecd' },
    { id: 'p4', name: 'Helen Legacy', volume: '200 Ml', price: '23.000 KD', image: 'https://kw.gissah.com/web/image/product.product/1180/image_1920/1024x0?unique=5da9496' }
  ],
  luxury: [
    { id: 'p5', name: 'Martinique Osmanthus', volume: '200 Ml', price: '23.000 KD', image: 'https://kw.gissah.com/web/image/product.product/1163/image_1920/1024x0?unique=8340b11' },
    { id: 'p6', name: 'Capri', volume: '200 Ml', price: '23.000 KD', image: 'https://kw.gissah.com/web/image/product.product/711/image_1920/1024x0?unique=eca469a' },
    { id: 'p7', name: 'Calabria Eau de Parfum', volume: '200 Ml', price: '23.000 KD', image: 'https://kw.gissah.com/web/image/product.product/730/image_1920/1024x0?unique=3c9bfd7' },
    { id: 'p8', name: 'Imperial Oud', volume: '100 Ml', price: '32.000 KD', image: 'https://kw.gissah.com/web/image/product.product/1322/image_1920/1024x0?unique=9639072' }
  ]
};

export default function ProductCarousel({ title, type = 'signature', onAddToCart, onToggleWishlist, wishlist = [] }) {
  const scrollRef = useRef(null);
  const products = allProducts[type] || allProducts.signature;

  const scroll = (direction) => {
    if (scrollRef.current) {
      const scrollAmount = direction === 'left' ? -340 : 340;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <section className={styles.carouselSection}>
      <div className={styles.header}>
        <h2 className={styles.title}>{title}</h2>
        <div className={styles.controls}>
          <button className={styles.scrollBtn} onClick={() => scroll('left')} aria-label="Scroll left">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <line x1="19" y1="12" x2="5" y2="12"></line>
              <polyline points="12 19 5 12 12 5"></polyline>
            </svg>
          </button>
          <button className={styles.scrollBtn} onClick={() => scroll('right')} aria-label="Scroll right">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <line x1="5" y1="12" x2="19" y2="12"></line>
              <polyline points="12 5 19 12 12 19"></polyline>
            </svg>
          </button>
        </div>
      </div>

      <div className={styles.track} ref={scrollRef}>
        {products.map(p => {
          const isWishlisted = wishlist.includes(p.id);
          return (
            <div key={p.id} className={styles.card}>
              <div className={styles.imageWrap}>
                <img src={p.image} alt={p.name} className={styles.productImage} />
                
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

                {/* Desktop Action Overlay */}
                <div className={styles.actionOverlay}>
                  <button className={styles.actionBtn} onClick={() => onAddToCart(p)}>
                    ADD TO CART
                  </button>
                  <button className={`${styles.actionBtn} ${styles.buyNowBtn}`} onClick={() => { onAddToCart(p); }}>
                    BUY NOW
                  </button>
                </div>

                {/* Mobile Actions Overlay */}
                <div className={styles.mobileActions}>
                  <button className={styles.mobileBuyBtn} onClick={() => onAddToCart(p)} aria-label="Buy Now">
                    ⚡ BUY
                  </button>
                  <button className={styles.mobileAddBtn} onClick={() => onAddToCart(p)} aria-label="Add to Basket">
                    +
                  </button>
                </div>
              </div>

              <div className={styles.info}>
                <h3 className={styles.name}>{p.name}</h3>
                <p className={styles.volume}>{p.volume}</p>
                <p className={styles.price}>{p.price}</p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

