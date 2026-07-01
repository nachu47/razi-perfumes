'use client';
import { useState, useEffect } from 'react';
import styles from './Header.module.css';

export default function Header({ onSearchOpen, onCartOpen, onCountryOpen, cartCount, wishlistCount = 0 }) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 40) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header className={`${styles.header} ${scrolled ? styles.scrolled : ''}`}>
      <div className={styles.inner}>
        {/* Left: Shop Trigger */}
        <div className={styles.left}>
          <button className={styles.shopBtn} aria-label="Shop menu">
            <svg className={styles.menuIcon} width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <line x1="4" y1="6" x2="20" y2="6" />
              <line x1="4" y1="12" x2="15" y2="12" />
              <line x1="4" y1="18" x2="18" y2="18" />
            </svg>
            <span className={styles.shopLabel}>SHOP</span>
          </button>
        </div>

        {/* Center: Logo */}
        <div className={styles.center}>
          <a href="/" className={styles.logo} aria-label="Razi Perfumes Home">
            <span className={styles.logoArabic}>رازي</span>
            <span className={styles.logoLatin}>RAZI PERFUMES</span>
          </a>
        </div>

        {/* Right: Actions */}
        <div className={styles.right}>
          {/* Search */}
          <button className={styles.iconBtn} onClick={onSearchOpen} aria-label="Search">
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="11" cy="11" r="8"/>
              <line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
          </button>

          {/* Country Selector */}
          <button className={`${styles.iconBtn} ${styles.hideOnMobile}`} onClick={onCountryOpen} aria-label="Select country">
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="12" cy="12" r="10"/>
              <line x1="2" y1="12" x2="22" y2="12"/>
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
            </svg>
          </button>

          {/* Wishlist */}
          <button className={styles.iconBtn} aria-label="Wishlist" style={{position:'relative'}}>
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
            </svg>
            {wishlistCount > 0 && (
              <span className={styles.wishlistBadge}>{wishlistCount}</span>
            )}
          </button>

          {/* Account */}
          <button className={`${styles.iconBtn} ${styles.hideOnMobile}`} aria-label="My account">
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
          </button>

          {/* Shopping Bag / Cart */}
          <button className={styles.iconBtn} onClick={onCartOpen} aria-label="Cart" style={{position:'relative'}}>
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
              <line x1="3" y1="6" x2="21" y2="6"/>
              <path d="M16 10a4 4 0 0 1-8 0"/>
            </svg>
            {cartCount > 0 && (
              <span className={styles.cartBadge}>{cartCount}</span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}

