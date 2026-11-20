import Image from 'next/image';
import { getLocale, getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import styles from './CategorySection.module.css';
import type { CollectionDTO } from '@/lib/catalog';
import { pick } from '@/lib/site';

export default async function CategorySection({ collections }: { collections: CollectionDTO[] }) {
  const t = await getTranslations();
  const locale = await getLocale();
  return (
    <section className={styles.section}>
      {/* Brand Poem */}
      <div className={styles.brandIntro}>
        {locale === 'ar' ? (
          <p className={styles.introText}>
            <em>عطر</em> يوقظ <em>الذاكرة</em> ويبقى كـ<em>الهمس</em>،
            <br />
            يحملك عبر <em>الزمن</em>، حيث لا تُنسى <em>المشاعر</em> أبداً.
          </p>
        ) : (
          <p className={styles.introText}>
            A <em>fragrance</em> that awakens <em>memory</em> and lingers like a <em>whisper</em>,
            <br />
            carrying you through <em>time</em>, where emotions are never <em>forgotten</em>.
          </p>
        )}
      </div>

      <h2 className={styles.sectionTitle}>{t('home.shopByCollection')}</h2>

      <div className={styles.grid}>
        {collections.map((c) => {
          const name = pick(locale, c.nameEn, c.nameAr);
          return (
            <Link key={c.id} href={`/collection/${c.slug}`} className={styles.card}>
              <div className={styles.imageWrap}>
                {c.image && <Image src={c.image} alt={name} width={800} height={800} sizes="(max-width: 768px) 50vw, 25vw" className={styles.image} />}
                <div className={styles.overlay} />
              </div>
              <div className={styles.content}>
                <h3 className={styles.name}>{name}</h3>
                <span className={styles.explore}>{t('common.discover')}</span>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
