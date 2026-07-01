'use client';
import styles from './CategorySection.module.css';

const categories = [
  { id: 'signature', name: 'Signature Line', image: 'https://kw.gissah.com/web/image/product.public.category/13/image_1920/1024x0?unique=cc42a6c' },
  { id: 'luxury', name: 'Luxury Line', image: 'https://kw.gissah.com/web/image/product.public.category/11/image_1920/1024x0?unique=3d8a714' },
  { id: 'hair-body', name: 'Hair & Body', image: 'https://kw.gissah.com/web/image/product.public.category/52/image_1920/1024x0?unique=1e629ba' },
  { id: 'sets', name: 'Sets Line', image: 'https://kw.gissah.com/web/image/product.public.category/18/image_1920/1024x0?unique=1ab1e03' },
  { id: 'musk', name: 'Musk Collection', image: 'https://kw.gissah.com/web/image/product.public.category/14/image_1920/1024x0?unique=fdb1ef3' },
  { id: 'home-fragrance', name: 'Home Fragrance', image: 'https://kw.gissah.com/web/image/product.public.category/53/image_1920/1024x0?unique=21288ce' },
];

export default function CategorySection() {
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
          <a key={c.id} href={`/collection/${c.id}`} className={styles.card}>
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

