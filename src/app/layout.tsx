import type { Metadata } from "next"
import { Fraunces, Source_Sans_3, IBM_Plex_Mono } from "next/font/google"
import "./globals.css"

const display = Fraunces({
  variable: "--font-display",
  subsets: ["latin"],
})

const sans = Source_Sans_3({
  variable: "--font-sans",
  subsets: ["latin"],
})

const mono = IBM_Plex_Mono({
  variable: "--font-mono",
  weight: ["400", "500"],
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "Lamb Daily — Samuel Lamb's crossword",
  description:
    "A private daily crossword with timer, check, streaks, and a small leaderboard.",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      className={`${display.variable} ${sans.variable} ${mono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  )
}
