import type { Page } from '@playwright/test'

// `next dev` draws its dev tools button in the bottom-left corner, on top of
// the collapsed sidebar's account button, and it swallows the click. It only
// exists in dev, so hide it rather than click around it. Build errors still
// fail the test; they are just not drawn.
// An adopted stylesheet, not a <style> tag: a tag added to <head> while React
// hydrates is a mismatch, and the re-mount breaks the auth flow.
export async function hideNextDevTools(page: Page) {
  await page.addInitScript(() => {
    const sheet = new CSSStyleSheet()
    sheet.replaceSync('nextjs-portal { display: none !important; }')
    document.adoptedStyleSheets = [...document.adoptedStyleSheets, sheet]
  })
}
