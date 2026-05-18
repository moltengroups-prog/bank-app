import './globals.css';

export const metadata = {
  title: 'Bank of Molten — Admin',
  description: 'Internal banking operations console',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
