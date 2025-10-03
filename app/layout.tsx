import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'PubWon - Customer Discovery Platform',
  description: 'Automated customer discovery through Reddit analysis and GitHub integration',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
