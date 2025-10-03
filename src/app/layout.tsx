import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'PubWon - Customer Discovery & Development',
  description: 'Integrate customer discovery into your development cycle',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
