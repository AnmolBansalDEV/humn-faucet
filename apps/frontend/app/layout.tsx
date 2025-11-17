import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/providers';
import { PublicEnvScript } from 'next-runtime-env';

const geist = Geist({ subsets: ["latin"] });
const geistMono = Geist_Mono({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: 'TEST HUMN Token Faucet - Private & Sybil Resistant',
  description: 'Claim TestHumanToken (HUMN) with X (Twitter) verification via private, zero-knowledge proofs',
  generator: 'v0.app',
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <head>
        <PublicEnvScript />
      </head>
      <body className={`${geist.className} ${geistMono.className}`}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}
