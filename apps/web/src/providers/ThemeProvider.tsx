'use client'

import { ThemeProvider as NextThemesProvider } from 'next-themes'

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    // TEMPORARY: force light mode and hide the theme toggle.
    // To restore theme switching, drop `forcedTheme`, set defaultTheme back to
    // "system", and un-hide the toggle in DashboardSidebar.tsx.
    <NextThemesProvider attribute="class" defaultTheme="light" forcedTheme="light" enableSystem disableTransitionOnChange>
      {children}
    </NextThemesProvider>
  )
}
