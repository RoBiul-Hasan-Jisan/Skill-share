import { Inter_Tight } from 'next/font/google'
import { Toaster } from 'react-hot-toast'
import { FirebaseProvider } from '@/components/auth/FirebaseProvider'
import './globals.css'

const interTight = Inter_Tight({
  subsets: ['latin'],
  variable: '--font-inter-tight',
})

export const metadata = {
  title: 'SkillShare',
  description: 'Collaborative team workspace',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Light mode logo */}
        <link
          rel="icon"
          href="/logo-light-simple.svg"
          media="(prefers-color-scheme: light)"
        />

        {/* Dark mode logo */}
        <link
          rel="icon"
          href="/logo-dark-simple.svg"
          media="(prefers-color-scheme: dark)"
        />

        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  const stored = localStorage.getItem('theme')
                  const system = window.matchMedia(
                    '(prefers-color-scheme: dark)'
                  ).matches ? 'dark' : 'light'

                  document.documentElement.classList.add(stored || system)
                } catch(e) {}
              })()
            `,
          }}
        />
      </head>

      <body className={interTight.variable}>
        <FirebaseProvider>
          {children}
        </FirebaseProvider>

        <Toaster position="bottom-right" />
      </body>
    </html>
  )
}