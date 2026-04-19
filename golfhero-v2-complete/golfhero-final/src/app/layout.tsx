import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'GolfHero — Play Golf. Change Lives. Win Big.',
  description: 'Subscribe, log your Stableford scores, enter monthly prize draws, and support the charity you love. Golf with purpose.',
  keywords: ['golf', 'charity', 'prize draw', 'stableford', 'lottery', 'fundraising'],
  openGraph: {
    title: 'GolfHero',
    description: 'Play Golf. Change Lives. Win Big.',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className={inter.className}>
        {children}
      </body>
    </html>
  )
}
