import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { Poppins, Inter, Geist_Mono } from 'next/font/google'
import { ClerkProvider } from '@clerk/nextjs'
import { Toaster } from '@/components/ui/sonner'
import './globals.css'

const poppins = Poppins({
  variable: '--font-poppins',
  weight: ['500', '600', '700'],
  subsets: ['latin'],
})
const inter = Inter({ variable: '--font-inter', subsets: ['latin'] })
const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'AuraStay — Hotel Operating System',
  description:
    'AuraStay is a B2B hotel property management system for revenue managers and general managers: live inventory, dynamic pricing, reservations, and folio management.',
  generator: 'v0.app',
}

export const viewport: Viewport = {
  themeColor: '#0f172a',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <ClerkProvider>
      <html
        lang="en"
        className={`${poppins.variable} ${inter.variable} ${geistMono.variable}`}
      >
        <body className="bg-background font-sans antialiased">
          {children}
          <Toaster position="top-right" richColors />
          {process.env.NODE_ENV === 'production' && <Analytics />}
        </body>
      </html>
    </ClerkProvider>
  )
}
