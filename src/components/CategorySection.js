'use client';
import styles from './CategorySection.module.css';

import { categories } from '../data/productsData';

export default function CategorySection({ onNavigate }) {
  return (
    <section className={styles.section}>
      {/* Brand Poem */}
      <div className={styles.brandIntro}>
        <p className={styles.introText}>
          A <em>fragrance</em> that awakens <em>memory</em> and lingers like a <em>whisper</em>,
          <br />
          carrying you through <em>time</em>, where emotions are never <em>forgotten</em>.
        </p>
      </div>

      <h2 className={styles.sectionTitle}>SHOP BY COLLECTION</h2>

      <div className={styles.grid}>
        {categories.map(c => (
          <a 
            key={c.id} 
            href={`/collection/${c.id}`} 
            className={styles.card}
            onClick={(e) => {
              e.preventDefault();
              onNavigate && onNavigate('collection', c.id);
            }}
          >
            <div className={styles.imageWrap}>
              <img src={c.image} alt={c.name} className={styles.image} />
              <div className={styles.overlay} />
            </div>
            <div className={styles.content}>
              <h3 className={styles.name}>{c.name}</h3>
              <span className={styles.explore}>DISCOVER</span>
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}

