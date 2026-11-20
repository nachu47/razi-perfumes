import { ImageResponse } from 'next/og';

// Default social-share image (product pages override it with the product photo)
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
export const alt = 'Razi Perfumes — Luxury Arabian Fragrances';

export default async function OgImage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #120F0D 0%, #25201C 100%)',
          color: '#FFFDF9',
        }}
      >
        <div style={{ width: 120, height: 2, background: '#CBA600', marginBottom: 40 }} />
        <div style={{ fontSize: 88, letterSpacing: 24, color: '#CBA600' }}>RAZI</div>
        <div style={{ fontSize: 30, letterSpacing: 14, marginTop: 12 }}>PERFUMES</div>
        <div style={{ fontSize: 26, marginTop: 48, color: '#E0C13D', fontStyle: 'italic' }}>
          {locale === 'ar' ? 'Luxury Arabian Fragrances · Kuwait & GCC' : 'Luxury Arabian Fragrances · Kuwait & GCC'}
        </div>
        <div style={{ width: 120, height: 2, background: '#CBA600', marginTop: 40 }} />
      </div>
    ),
    size,
  );
}
