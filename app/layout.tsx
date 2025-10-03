import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Pubwon - Customer Discovery & Development',
  description: 'Integrate customer discovery into your development cycle',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
