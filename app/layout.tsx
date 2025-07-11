import { type Metadata } from 'next'
import {
  ClerkProvider,
} from '@clerk/nextjs'
import { Inter } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from 'next-themes'
import { Toaster } from 'sonner'
import { TrialProvider } from '@/components/trial/trial-provider'
import { TrialBannerWrapper } from '@/components/trial/trial-banner-wrapper'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Reasonet Platform',
  description: 'The brain layer for VCS and Startup founders',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <body className={inter.className}>
          <ThemeProvider
            attribute="class"
            defaultTheme="light"
            enableSystem
            disableTransitionOnChange
          >
              {children}
              <Toaster />
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  )
}