import './globals.css';

export const metadata = {
  title: 'Gissah | Luxury Arabian Fragrances - Kuwait',
  description: 'Discover the world of Gissah luxury Arabian perfumes. Shop signature fragrances, luxury collections, and exclusive sets. Now in Kuwait.',
  keywords: 'Gissah, luxury perfume, Arabian fragrance, Kuwait, oud, signature collection',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>{children}</body>
    </html>
  );
}
