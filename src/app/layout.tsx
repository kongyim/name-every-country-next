'use client'
import './globals.css'
import { NextUIProvider } from '@nextui-org/react'

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html>
      <body>
        <NextUIProvider>{children}</NextUIProvider>
      </body>
    </html>
  )
}
