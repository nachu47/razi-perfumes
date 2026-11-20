import './globals.css';

// Fallback for requests outside the locale segment (the proxy normally handles those).
export default function RootNotFound() {
  return (
    <html lang="en">
      <body style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', textAlign: 'center', background: 'var(--ivory)' }}>
        <div>
          <p style={{ fontFamily: 'var(--font-heading)', fontSize: 80, color: 'var(--gold)', letterSpacing: '0.2em' }}>404</p>
          <h1 style={{ fontFamily: 'var(--font-heading)', letterSpacing: '0.15em', margin: '16px 0' }}>PAGE NOT FOUND</h1>
          <a href="/" style={{ display: 'inline-block', marginTop: 16, padding: '16px 28px', background: 'var(--dark)', color: '#fff', fontSize: 11, letterSpacing: '0.3em', fontWeight: 700, borderRadius: 4 }}>
            RETURN HOME
          </a>
        </div>
      </body>
    </html>
  );
}
